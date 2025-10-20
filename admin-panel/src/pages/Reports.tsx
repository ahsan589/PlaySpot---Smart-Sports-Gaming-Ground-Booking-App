import React, { useState, useEffect } from 'react';
import {
  Typography,
  Select,
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Tooltip,
  Dropdown,
  type MenuProps
} from 'antd';
import { 
  DollarOutlined, 
  UserOutlined, 
  BarChartOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  DownOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text } = Typography;
const { Option } = Select;

interface Ground {
  id: string;
  name: string;
  price: number;
  venueType: string;
  city: string;
  status: string;
  ownerId: string;
  ownerName: string;
  address?: string;
  contactInfo?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: any;
  role?: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  city?: string;
}

interface Stats {
  total: number;
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averageAmount: number;
  confirmedBookings?: number;
  activeGrounds?: number;
  recentUsers?: number;
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('bookings');
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Helper function to extract city from address (matching Profile.tsx)
  const extractCityFromAddress = (address: string): string => {
    if (!address) return 'N/A';

    const cities = ['Rawalpindi', 'Lahore', 'Karachi', 'Islamabad'];
    for (const city of cities) {
      if (address.includes(city)) {
        return city;
      }
    }
    return 'Other';
  };


  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.name || userData.displayName || 'N/A',
          phone: userData.phone || userData.phoneNumber || 'N/A',
          email: userData.email || 'N/A',
          city: userData.city || extractCityFromAddress(userData.address || '') || 'N/A'
        };
      }
      return { name: 'N/A', phone: 'N/A', email: 'N/A', city: 'N/A' };
    } catch (error) {
      console.warn(`Failed to fetch user data for ${userId}:`, error);
      return { name: 'N/A', phone: 'N/A', email: 'N/A', city: 'N/A' };
    }
  };

  // Fetch all grounds and users data
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        // Fetch grounds
        const groundsSnapshot = await getDocs(collection(db, 'grounds'));
        const groundsData = groundsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Extract city from address if city field is not available
            city: data.city || extractCityFromAddress(data.address || '')
          } as Ground;
        });
        setGrounds(groundsData);

        // Fetch users with proper city extraction
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Extract city from address for users as well
            city: data.city || extractCityFromAddress(data.address || '')
          } as User;
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching static data:', error);
        message.error('Error loading reference data');
      }
    };

    fetchStaticData();
  }, []);

  // Real-time data fetching based on report type
  useEffect(() => {
    setLoading(true);
    let unsubscribe: () => void;

    const setupRealTimeListener = async () => {
      try {
        let q;
        const collections = {
          bookings: 'bookings',
          payments: 'payments', 
          grounds: 'grounds',
          users: 'users'
        };

        const collectionName = collections[reportType as keyof typeof collections] || 'bookings';
        
        // Create query with ordering
        if (reportType === 'bookings' || reportType === 'payments') {
          q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, collectionName));
        }

        unsubscribe = onSnapshot(q,
          async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async (document) => {
              const docData = document.data();
              const processedData: any = {
                id: document.id,
                ...docData
              };
              
              // Handle timestamp conversion
              Object.keys(docData).forEach(key => {
                if (docData[key] instanceof Timestamp) {
                  processedData[key] = docData[key].toDate();
                }
              });

              // For payments, fetch complete user data if userId or playerInfo.id exists (like MonitorBookings.tsx)
              const userId = processedData.userId || processedData.playerInfo?.id;
              if (reportType === 'payments' && userId) {
                const userInfo = await fetchUserData(userId);
                processedData.userName = userInfo.name;
                processedData.userEmail = userInfo.email;
                processedData.userPhone = userInfo.phone;
                processedData.userCity = userInfo.city;
              }

              // For bookings, fetch user data if userId exists but user details are missing
              if (reportType === 'bookings' && processedData.userId && (!processedData.userName || !processedData.userEmail)) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', processedData.userId));
                  if (userDoc.exists()) {
                    const userData = (userDoc as any).data() as any;
                    processedData.userName = userData?.name || 'Unknown User';
                    processedData.userEmail = userData?.email || 'N/A';
                    processedData.userPhone = userData?.phone || 'N/A';
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
              }
              
              return processedData;
            }));
            
            console.log(`${reportType} data loaded:`, data);
            setRealTimeData(data);
            setLastUpdate(new Date());
            setLoading(false);
          },
          (error) => {
            console.error('Error in real-time listener:', error);
            setLoading(false);
            message.error(`Error loading ${reportType} data`);
          }
        );

      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        setLoading(false);
        message.error('Error setting up data connection');
      }
    };

    setupRealTimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [reportType]);

  // Process and enrich data for display
  const processedData = React.useMemo(() => {
    if (!realTimeData.length) return [];

    return realTimeData.map(item => {
      // Helper function to get ground info
      const getGroundInfo = (groundId: string) => {
        const ground = grounds.find(g => g.id === groundId);
        return {
          name: ground?.name || 'Unknown Ground',
          venueType: ground?.venueType || 'N/A',
          city: ground?.city || extractCityFromAddress(ground?.address || '') || 'N/A',
          price: ground?.price || 0,
          address: ground?.address || 'N/A'
        };
      };

      // Helper function to get user info
      const getUserInfo = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return {
          name: user?.name || item.userName || 'Unknown User',
          email: user?.email || item.userEmail || 'N/A',
          phone: user?.phone || item.userPhone || 'N/A',
          city: user?.city || extractCityFromAddress(user?.address || '') || 'N/A'
        };
      };

      switch (reportType) {
        case 'payments':
          // Get ground and user info
          const groundInfo = item.groundId ? getGroundInfo(item.groundId) : {
            name: item.groundName || 'Unknown Ground',
            venueType: 'N/A',
            city: 'N/A',
            price: 0,
            address: 'N/A'
          };

          // Use the already fetched user data from real-time listener
          const userInfo = {
            name: item.userName || 'Unknown User',
            email: item.userEmail || 'N/A',
            phone: item.userPhone || 'N/A',
            city: item.userCity || 'N/A'
          };

          // Normalize payment status
          const normalizePaymentStatus = (status: string) => {
            if (!status) return 'pending';
            const statusLower = status.toLowerCase();
            if (statusLower.includes('complete') || statusLower.includes('success') || statusLower.includes('paid')) {
              return 'completed';
            }
            if (statusLower.includes('fail') || statusLower.includes('cancel') || statusLower.includes('reject')) {
              return 'failed';
            }
            if (statusLower.includes('pending') || statusLower.includes('processing')) {
              return 'pending';
            }
            return status;
          };

          // Normalize payment method
          const normalizePaymentMethod = (method: string) => {
            if (!method) return 'N/A';
            const methodLower = method.toLowerCase();
            if (methodLower.includes('jazzcash')) {
              return 'JazzCash';
            }
            if (methodLower.includes('easypaisa')) {
              return 'EasyPaisa';
            }
            if (methodLower.includes('card') || methodLower.includes('credit') || methodLower.includes('debit')) {
              return 'Credit Card';
            }
            if (methodLower.includes('bank') || methodLower.includes('transfer')) {
              return 'Bank Transfer';
            }
            if (methodLower.includes('cash')) {
              return 'Cash';
            }
            if (methodLower.includes('digital') || methodLower.includes('wallet')) {
              return 'Digital Wallet';
            }
            return method.charAt(0).toUpperCase() + method.slice(1);
          };

          const paymentStatus = normalizePaymentStatus(item.status);
          const paymentMethod = normalizePaymentMethod(item.paymentMethod || item.method);
          const amount = item.amount || item.totalAmount || 0;
          const transactionId = item.transactionId || item.id?.slice(-8) || 'N/A';
          
          // Format date
          const formatDate = (date: any) => {
            if (!date) return 'N/A';
            if (date instanceof Date) {
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
            return String(date);
          };

          return {
            ...item,
            key: item.id,
            groundName: groundInfo.name,
            venueType: groundInfo.venueType,
            city: groundInfo.city,
            userName: userInfo.name,
            userEmail: userInfo.email,
            userPhone: userInfo.phone,
            displayAmount: `Rs. ${amount.toLocaleString()}`,
            rawAmount: amount,
            displayDate: formatDate(item.createdAt || item.paymentDate || item.date),
            status: paymentStatus,
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            bookingId: item.bookingId || 'N/A'
          };

        case 'bookings':
          const bookingGroundInfo = getGroundInfo(item.groundId);
          const bookingUserInfo = getUserInfo(item.userId);
          return {
            ...item,
            key: item.id,
            groundName: bookingGroundInfo.name,
            venueType: bookingGroundInfo.venueType,
            city: bookingGroundInfo.city,
            userName: bookingUserInfo.name,
            userEmail: bookingUserInfo.email,
            userPhone: bookingUserInfo.phone,
            displayDate: item.date || (item.createdAt ? item.createdAt.toLocaleDateString() : 'N/A'),
            displayTime: item.time || 'N/A',
            displayDuration: item.duration ? `${item.duration} hours` : 'N/A',
            displayAmount: item.totalAmount ? `Rs. ${item.totalAmount.toLocaleString()}` : 'Rs. 0',
            displayPrice: item.pricePerHour ? `Rs. ${item.pricePerHour}/hour` : 'N/A',
            status: item.status || 'pending',
            paymentStatus: item.paymentStatus || 'pending'
          };

        case 'grounds':
          const ownerInfo = getUserInfo(item.ownerId);
          return {
            ...item,
            key: item.id,
            displayPrice: item.price ? `Rs. ${item.price}/hour` : 'N/A',
            ownerName: ownerInfo.name,
            ownerEmail: ownerInfo.email,
            ownerPhone: ownerInfo.phone,
            status: item.status || 'inactive',
            displayAddress: item.address || 'N/A',
            contactInfo: item.contactInfo || 'N/A',
            city: item.city || extractCityFromAddress(item.address || '') || 'N/A'
          };

        case 'users':
          return {
            ...item,
            key: item.id,
            displayJoinDate: item.createdAt ? item.createdAt.toLocaleDateString() : 'N/A',
            role: item.role || 'user',
            phone: item.phone || 'N/A',
            address: item.address || 'N/A'
          };

        default:
          return { ...item, key: item.id };
      }
    });
  }, [realTimeData, grounds, users, reportType]);

  // Calculate statistics
  const calculateStats = (): Stats => {
    const baseStats: Stats = {
      total: processedData.length,
      totalRevenue: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      averageAmount: 0
    };

    if (reportType === 'payments' && processedData.length > 0) {
      let totalAmount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let failedCount = 0;

      processedData.forEach(item => {
        const amount = item.rawAmount || item.amount || 0;
        totalAmount += amount;

        switch (item.status) {
          case 'completed':
            completedCount++;
            baseStats.totalRevenue += amount;
            break;
          case 'pending':
            pendingCount++;
            break;
          case 'failed':
            failedCount++;
            break;
          default:
            pendingCount++;
        }
      });

      baseStats.completedPayments = completedCount;
      baseStats.pendingPayments = pendingCount;
      baseStats.failedPayments = failedCount;
      baseStats.averageAmount = totalAmount / processedData.length;
    }

    // Add additional stats for other report types
    if (reportType === 'bookings') {
      const confirmedBookings = processedData.filter(item => 
        item.status === 'confirmed' || item.status === 'completed'
      ).length;
      baseStats.confirmedBookings = confirmedBookings;
    }

    if (reportType === 'grounds') {
      const activeGrounds = processedData.filter(item => 
        item.status === 'active' || item.status === 'approved'
      ).length;
      baseStats.activeGrounds = activeGrounds;
    }

    if (reportType === 'users') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = processedData.filter(item => {
        const userDate = item.createdAt;
        return userDate && new Date(userDate) > thirtyDaysAgo;
      }).length;
      baseStats.recentUsers = recentUsers;
    }

    return baseStats;
  };

  const stats = calculateStats();

  // Payment-specific columns
  const getPaymentColumns = (): ColumnsType<any> => [
    {
      title: 'Date',
      dataIndex: 'displayDate',
      key: 'date',
      width: 120,
      sorter: (a, b) => {
        const dateA = a.createdAt || a.paymentDate;
        const dateB = b.createdAt || b.paymentDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      render: (id: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {id}
        </Text>
      )
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
      key: 'userName',
      width: 150
    },
    {
      title: 'User Email',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200
    },
    {
      title: 'User Phone',
      dataIndex: 'userPhone',
      key: 'userPhone',
      width: 130,
      render: (phone: string) => phone !== 'N/A' ? phone : '-'
    },
    {
      title: 'Ground',
      dataIndex: 'groundName',
      key: 'groundName',
      width: 150
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (city: string) => city !== 'N/A' ? city : '-'
    },
    {
      title: 'Amount',
      dataIndex: 'displayAmount',
      key: 'amount',
      width: 120,
      sorter: (a, b) => (a.rawAmount || 0) - (b.rawAmount || 0),
      render: (amount: string) => (
        <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
          {amount}
        </Text>
      )
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (method: string) => (
        <Tag icon={<CreditCardOutlined />} color="blue">
          {method}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const statusConfig = {
          completed: {
            color: 'green',
            icon: <CheckCircleOutlined />,
            text: 'COMPLETED'
          },
          pending: {
            color: 'orange',
            icon: <ClockCircleOutlined />,
            text: 'PENDING'
          },
          failed: {
            color: 'red',
            icon: <CloseCircleOutlined />,
            text: 'FAILED'
          }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Payment Details">
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => showRecordDetails(record)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  // Export functions
  const handleExportExcel = () => {
    try {
      if (processedData.length === 0) {
        message.warning('No data to export');
        return;
      }

      const exportData = processedData.map(item => {
        const exportItem: any = {};
        Object.keys(item).forEach(key => {
          if (key !== 'key' && key !== 'id' && typeof item[key] !== 'object') {
            const cleanKey = key.replace('display', '').replace(/([A-Z])/g, ' $1').trim();
            exportItem[cleanKey] = item[key];
          }
        });
        return exportItem;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${reportType}_report`);
      XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      message.success('Excel report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Error exporting Excel report');
    }
  };

  const handleExportCSV = () => {
    try {
      if (processedData.length === 0) {
        message.warning('No data to export');
        return;
      }

      const exportData = processedData.map(item => {
        const exportItem: any = {};
        Object.keys(item).forEach(key => {
          if (key !== 'key' && key !== 'id' && typeof item[key] !== 'object') {
            const cleanKey = key.replace('display', '').replace(/([A-Z])/g, ' $1').trim();
            exportItem[cleanKey] = item[key];
          }
        });
        return exportItem;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('CSV report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Error exporting CSV report');
    }
  };

  const handleExportPDF = () => {
    try {
      if (processedData.length === 0) {
        message.warning('No data to export');
        return;
      }

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${processedData.length}`, 14, 35);

      // Prepare table data - filter columns that have dataIndex
      const columns = getTableColumns().filter(col => 'dataIndex' in col);
      const headers = columns.map(col => col.title);
      const body = processedData.map(row =>
        columns.map(col => {
          const value = row[(col as any).dataIndex];
          return typeof value === 'string' ? value : String(value || '');
        })
      );

      // Add table
      autoTable(doc, {
        head: [headers] as any,
        body: body,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [22, 119, 255],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Save the PDF
      doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF report exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      message.error('Error exporting PDF report');
    }
  };

  const handleExportJSON = () => {
    try {
      if (processedData.length === 0) {
        message.warning('No data to export');
        return;
      }

      const exportData = processedData.map(item => {
        const exportItem: any = {};
        Object.keys(item).forEach(key => {
          if (key !== 'key' && typeof item[key] !== 'object') {
            exportItem[key] = item[key];
          }
        });
        return exportItem;
      });

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('JSON report exported successfully');
    } catch (error) {
      console.error('JSON export error:', error);
      message.error('Error exporting JSON report');
    }
  };

  const exportItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: 'Excel (.xlsx)',
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel
    },
    {
      key: 'csv',
      label: 'CSV (.csv)',
      icon: <FileTextOutlined />,
      onClick: handleExportCSV
    },
    {
      key: 'pdf',
      label: 'PDF (.pdf)',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF
    }
  ];

  const showRecordDetails = (record: any) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  // Get table columns based on report type - Only show action button for payments
  const getTableColumns = (): ColumnsType<any> => {
    if (reportType === 'payments') {
      return getPaymentColumns();
    }

    // For other report types, don't include the action button
    const columnConfigs = {
      bookings: [
        { title: 'Date', dataIndex: 'displayDate', key: 'date', width: 120 },
        { title: 'Time', dataIndex: 'displayTime', key: 'time', width: 100 },
        { title: 'Duration', dataIndex: 'displayDuration', key: 'duration', width: 100 },
        { title: 'Ground', dataIndex: 'groundName', key: 'groundName', width: 150 },
        { title: 'Venue Type', dataIndex: 'venueType', key: 'venueType', width: 120 },
        { title: 'City', dataIndex: 'city', key: 'city', width: 100 },
        { title: 'User Name', dataIndex: 'userName', key: 'userName', width: 150 },
        { title: 'User Email', dataIndex: 'userEmail', key: 'userEmail', width: 200 },
        { title: 'User Phone', dataIndex: 'userPhone', key: 'userPhone', width: 130 },
        { 
          title: 'Amount', 
          dataIndex: 'displayAmount', 
          key: 'amount', 
          width: 120,
          render: (amount: string) => <Text strong style={{ color: '#52c41a' }}>{amount}</Text>
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: (status: string) => (
            <Tag color={
              status === 'confirmed' || status === 'completed' ? 'green' :
              status === 'pending' ? 'orange' : 'red'
            }>
              {String(status)?.toUpperCase()}
            </Tag>
          )
        },
      ],
      grounds: [
        { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
        { title: 'Venue Type', dataIndex: 'venueType', key: 'venueType', width: 120 },
        { title: 'City', dataIndex: 'city', key: 'city', width: 100 },
        { title: 'Address', dataIndex: 'displayAddress', key: 'address', width: 200 },
        { 
          title: 'Price/Hour', 
          dataIndex: 'displayPrice', 
          key: 'price', 
          width: 120,
          render: (price: string) => <Text strong>{price}</Text>
        },
        { title: 'Contact Info', dataIndex: 'contactInfo', key: 'contactInfo', width: 150 },
        { title: 'Owner Name', dataIndex: 'ownerName', key: 'owner', width: 150 },
        { title: 'Owner Email', dataIndex: 'ownerEmail', key: 'ownerEmail', width: 200 },
        { title: 'Owner Phone', dataIndex: 'ownerPhone', key: 'ownerPhone', width: 130 },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: (status: string) => (
            <Tag color={
              status === 'active' || status === 'approved' ? 'green' :
              status === 'pending' ? 'orange' : 'red'
            }>
              {String(status)?.toUpperCase()}
            </Tag>
          )
        },
      ],
      users: [
        { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
        { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
        { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 120 },
        { title: 'Address', dataIndex: 'address', key: 'address', width: 200 },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
          width: 100,
          render: (role: string) => (
            <Tag color={role === 'admin' ? 'red' : 'blue'}>
              {String(role)?.toUpperCase()}
            </Tag>
          )
        },
        { title: 'Join Date', dataIndex: 'displayJoinDate', key: 'joinDate', width: 120 },
      ]
    };

    const currentColumns = columnConfigs[reportType as keyof typeof columnConfigs] || [];
    return [...currentColumns] as ColumnsType<any>;
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <BarChartOutlined style={{ marginRight: 12, color: '#4F46E5' }} />
          Real-Time Admin Reports
        </Title>
        <Text type="secondary">Live monitoring of all system activities and data</Text>
        
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {processedData.length} {reportType} records
          </Text>
        </div>
      </div>

      {/* Controls Card */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Report Type:</Text>
            <Select 
              value={reportType} 
              onChange={setReportType}
              style={{ width: 200, marginLeft: 8 }}
              loading={loading}
            >
              <Option value="bookings">📊 Bookings</Option>
              <Option value="payments">💳 Payments</Option>
              <Option value="grounds">🏟️ Grounds</Option>
              <Option value="users">👥 Users</Option>
            </Select>
          </Col>
          
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={() => setLastUpdate(new Date())}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
          
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Dropdown menu={{ items: exportItems }} placement="bottomRight">
                <Button icon={<FileExcelOutlined />}>
                  Export <DownOutlined />
                </Button>
              </Dropdown>
              <Text type="secondary">
                Last update: {lastUpdate.toLocaleTimeString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.total}
              valueStyle={{ color: '#4F46E5' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>

        {reportType === 'payments' && (
          <>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  precision={0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix="Rs."
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Completed"
                  value={stats.completedPayments}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Pending"
                  value={stats.pendingPayments}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Failed"
                  value={stats.failedPayments}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </>
        )}

        {reportType === 'bookings' && stats.confirmedBookings !== undefined && (
          <Col span={6}>
            <Card>
              <Statistic
                title="Confirmed Bookings"
                value={stats.confirmedBookings}
                valueStyle={{ color: '#faad14' }}
                prefix={<SafetyCertificateOutlined />}
              />
            </Card>
          </Col>
        )}

        {reportType === 'grounds' && stats.activeGrounds !== undefined && (
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Grounds"
                value={stats.activeGrounds}
                valueStyle={{ color: '#52c41a' }}
                prefix={<EnvironmentOutlined />}
              />
            </Card>
          </Col>
        )}

        {reportType === 'users' && stats.recentUsers !== undefined && (
          <Col span={6}>
            <Card>
              <Statistic
                title="Recent Users (30d)"
                value={stats.recentUsers}
                valueStyle={{ color: '#faad14' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Data Table */}
      <Card
        title={
          <Space>
            <Text strong>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</Text>
            <Tag color={loading ? "orange" : "green"} icon={<ReloadOutlined spin={loading} />}>
              {loading ? "Loading..." : "Live"}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            {reportType === 'payments' && (
              <Text type="secondary">
                Revenue: Rs. {stats.totalRevenue.toLocaleString()}
              </Text>
            )}
            <Text type="secondary">Showing {processedData.length} records</Text>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        {processedData.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <DollarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <br />
            <Text type="secondary">No {reportType} data found</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {reportType === 'payments' 
                ? 'No payment records found in your database' 
                : `No ${reportType} records found`}
            </Text>
          </div>
        ) : (
          <Table
            columns={getTableColumns()}
            dataSource={processedData}
            loading={loading}
            scroll={{ x: 1300 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`
            }}
          />
        )}
      </Card>

      {/* Detail Modal - Only for payments */}
      <Modal
        title={`Payment Details - ${selectedRecord?.transactionId || 'N/A'}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Transaction ID" span={2}>
              <Text code>{selectedRecord.transactionId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                {selectedRecord.displayAmount}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={
                selectedRecord.status === 'completed' ? 'green' :
                selectedRecord.status === 'pending' ? 'orange' : 'red'
              }>
                {selectedRecord.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              {selectedRecord.paymentMethod}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {selectedRecord.displayDate}
            </Descriptions.Item>
            <Descriptions.Item label="User Name">
              {selectedRecord.userName}
            </Descriptions.Item>
            <Descriptions.Item label="User Email">
              {selectedRecord.userEmail}
            </Descriptions.Item>
            <Descriptions.Item label="User Phone">
              {selectedRecord.userPhone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ground">
              {selectedRecord.groundName}
            </Descriptions.Item>
            <Descriptions.Item label="City">
              {selectedRecord.city}
            </Descriptions.Item>
            <Descriptions.Item label="Booking ID" span={2}>
              {selectedRecord.bookingId}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Reports;