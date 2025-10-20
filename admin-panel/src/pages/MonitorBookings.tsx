import React, { useState, useEffect } from 'react';
import {
  Table,
  Typography,
  Tabs,
  Card,
  Tag,
  Avatar,
  Input,
  Button,
  Select,
  Statistic,
  Row,
  Col,
  DatePicker,
  Spin,
  Alert,
  Modal,
  Descriptions,
  Image
} from 'antd';
import { 
  UserOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PictureOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  groundId: string;
  groundName: string;
  groundAddress?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string; // Added owner phone
  date: string;
  time: string;
  duration: number;
  pricePerHour: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: any;
}

interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  date: string;
  groundId: string;
  groundInfo: {
    address: string;
    name: string;
  };
  ownerInfo: {
    email: string;
    id: string;
    name: string;
    phone?: string; // Added owner phone
  };
  paymentMethod: string;
  playerInfo: {
    email: string;
    id: string;
    name: string | null;
    phone: string | null;
  };
  screenshotUrl: string;
  status: string;
  time: string;
  transactionId: string;
  senderMobile: string;
  transactionDateTime: string;
}

interface OwnerInfo {
  id: string;
  name: string;
  email: string;
}

const MonitorBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [bookingSearchText, setBookingSearchText] = useState('');
  const [paymentSearchText, setPaymentSearchText] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch user data from users collection
  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.name || userData.displayName || 'N/A',
          phone: userData.phone || userData.phoneNumber || 'N/A',
          email: userData.email || 'N/A'
        };
      }
      return { name: 'N/A', phone: 'N/A', email: 'N/A' };
    } catch (error) {
      console.warn(`Failed to fetch user data for ${userId}:`, error);
      return { name: 'N/A', phone: 'N/A', email: 'N/A' };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch bookings from Firestore
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Process each booking in parallel
      const bookingPromises = bookingsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let ownerInfo: OwnerInfo | null = null;
        let groundAddress = null;
        let userInfo = { name: 'N/A', phone: 'N/A', email: 'N/A' };
        let ownerUserInfo = { name: 'N/A', phone: 'N/A', email: 'N/A' };

        // Parallelize fetches for user, ground, and owner
        const fetchPromises = [];

        // Fetch user information
        if (data.userId) {
          fetchPromises.push(
            fetchUserData(data.userId).then(info => { userInfo = info; })
          );
        }

        // Fetch ground and owner info
        if ((!data.ownerInfo && !data.ownerName && data.groundId) || data.ownerId) {
          fetchPromises.push(
            (async () => {
              try {
                let ownerIdToFetch = data.ownerId;

                if (!ownerIdToFetch && data.groundId) {
                  const groundDoc = await getDoc(doc(db, 'grounds', data.groundId));
                  if (groundDoc.exists()) {
                    const groundData = groundDoc.data();
                    const ownerData = groundData.ownerInfo || {
                      id: groundData.ownerId,
                      name: groundData.ownerName,
                      email: groundData.ownerEmail
                    };
                    ownerInfo = {
                      id: ownerData.id || '',
                      name: ownerData.name || '',
                      email: ownerData.email || ''
                    } as OwnerInfo;
                    groundAddress = groundData.address;
                    ownerIdToFetch = groundData.ownerId || groundData.ownerInfo?.id;
                  }
                }

                if (ownerIdToFetch) {
                  ownerUserInfo = await fetchUserData(ownerIdToFetch);
                }
              } catch (err) {
                console.warn(`Failed to fetch ground/owner info for ${data.groundId}:`, err);
              }
            })()
          );
        }

        // Wait for all fetches to complete
        await Promise.all(fetchPromises);

        // Use the owner info from user document as primary source
        const finalOwnerName = ownerUserInfo.name !== 'N/A' ? ownerUserInfo.name :
                              data.ownerName || data.ownerInfo?.name || (ownerInfo as unknown as OwnerInfo)?.name;
        const finalOwnerEmail = ownerUserInfo.email !== 'N/A' ? ownerUserInfo.email :
                               data.ownerEmail || data.ownerInfo?.email || (ownerInfo as unknown as OwnerInfo)?.email;
        const finalOwnerPhone = ownerUserInfo.phone;

        return {
          id: docSnapshot.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: userInfo.name,
          userPhone: userInfo.phone,
          groundId: data.groundId,
          groundName: data.groundName,
          groundAddress: data.groundAddress || groundAddress,
          ownerId: data.ownerId || data.ownerInfo?.id || (ownerInfo as unknown as OwnerInfo)?.id,
          ownerName: finalOwnerName,
          ownerEmail: finalOwnerEmail,
          ownerPhone: finalOwnerPhone,
          date: data.date,
          time: data.time,
          duration: data.duration,
          pricePerHour: data.pricePerHour,
          totalAmount: data.totalAmount,
          status: data.status,
          paymentStatus: data.paymentStatus,
          createdAt: data.createdAt
        };
      });

      const bookingsData = await Promise.all(bookingPromises);
      
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      // Fetch payments from Firestore
      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      const paymentsData: Payment[] = [];
      
      // Process each payment and fetch user data if needed
      for (const docSnapshot of paymentsSnapshot.docs) {
        const data = docSnapshot.data();
        let enhancedPlayerInfo = { ...data.playerInfo };
        let enhancedOwnerInfo = { ...data.ownerInfo };

        // If payment doesn't have complete player info, fetch from users collection
        if (data.playerInfo?.id && (!data.playerInfo.name || !data.playerInfo.phone)) {
          const userInfo = await fetchUserData(data.playerInfo.id);
          enhancedPlayerInfo = {
            ...data.playerInfo,
            name: data.playerInfo.name || userInfo.name,
            phone: data.playerInfo.phone || userInfo.phone,
            email: data.playerInfo.email || userInfo.email
          };
        }

        // Fetch owner details from users collection
        if (data.ownerInfo?.id) {
          const ownerUserInfo = await fetchUserData(data.ownerInfo.id);
          enhancedOwnerInfo = {
            ...data.ownerInfo,
            name: data.ownerInfo.name || ownerUserInfo.name,
            phone: ownerUserInfo.phone,
            email: data.ownerInfo.email || ownerUserInfo.email
          };
        }

        paymentsData.push({
          id: docSnapshot.id,
          amount: data.amount,
          createdAt: data.createdAt,
          date: data.date,
          groundId: data.groundId,
          groundInfo: data.groundInfo || {},
          ownerInfo: enhancedOwnerInfo,
          paymentMethod: data.paymentMethod,
          playerInfo: enhancedPlayerInfo,
          screenshotUrl: data.screenshotUrl,
          status: data.status,
          time: data.time,
          transactionId: data.transactionId,
          senderMobile: data.senderMobile || 'N/A',
          transactionDateTime: data.transactionDateTime || 'N/A'
        });
      }
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show booking details modal
  const showBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingModalVisible(true);
  };

  // Show payment details modal
  const showPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalVisible(true);
  };

  // Close modals
  const handleBookingModalClose = () => {
    setIsBookingModalVisible(false);
    setSelectedBooking(null);
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalVisible(false);
    setSelectedPayment(null);
  };

  // Apply filters for bookings
  useEffect(() => {
    applyBookingFilters();
  }, [bookingSearchText, bookingStatusFilter, dateRange, bookings]);

  // Apply filters for payments
  useEffect(() => {
    applyPaymentFilters();
  }, [paymentSearchText, paymentStatusFilter, dateRange, payments]);

  // Filter bookings based on search text, status, and date range
  const applyBookingFilters = () => {
    let result = [...bookings];
    
    // Apply search filter
    if (bookingSearchText) {
      result = result.filter(booking => 
        booking.userName.toLowerCase().includes(bookingSearchText.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(bookingSearchText.toLowerCase()) ||
        (booking.userPhone && booking.userPhone.toLowerCase().includes(bookingSearchText.toLowerCase())) ||
        booking.groundName.toLowerCase().includes(bookingSearchText.toLowerCase()) ||
        (booking.ownerName && booking.ownerName.toLowerCase().includes(bookingSearchText.toLowerCase())) ||
        (booking.ownerEmail && booking.ownerEmail.toLowerCase().includes(bookingSearchText.toLowerCase())) ||
        (booking.ownerPhone && booking.ownerPhone.toLowerCase().includes(bookingSearchText.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (bookingStatusFilter !== 'all') {
      result = result.filter(booking => booking.status === bookingStatusFilter);
    }
    
    // Apply date range filter
    if (dateRange && dateRange.length === 2) {
      result = result.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= dateRange[0] && bookingDate <= dateRange[1];
      });
    }
    
    setFilteredBookings(result);
  };

  // Filter payments based on search text, status, and date range
  const applyPaymentFilters = () => {
    let result = [...payments];
    
    // Apply search filter
    if (paymentSearchText) {
      result = result.filter(payment => 
        payment.transactionId.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        payment.paymentMethod.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        payment.playerInfo.email.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        (payment.playerInfo.name && payment.playerInfo.name.toLowerCase().includes(paymentSearchText.toLowerCase())) ||
        (payment.playerInfo.phone && payment.playerInfo.phone.toLowerCase().includes(paymentSearchText.toLowerCase())) ||
        payment.groundInfo.name.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        payment.ownerInfo.name.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        (payment.ownerInfo.phone && payment.ownerInfo.phone.toLowerCase().includes(paymentSearchText.toLowerCase())) ||
        payment.senderMobile.toLowerCase().includes(paymentSearchText.toLowerCase()) ||
        payment.transactionDateTime.toLowerCase().includes(paymentSearchText.toLowerCase())
      );
    }
    
    // Apply status filter
    if (paymentStatusFilter !== 'all') {
      result = result.filter(payment => payment.status === paymentStatusFilter);
    }
    
    // Apply date range filter
    if (dateRange && dateRange.length === 2) {
      result = result.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= dateRange[0] && paymentDate <= dateRange[1];
      });
    }
    
    setFilteredPayments(result);
  };

  // Handle search input changes
  const handleBookingSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookingSearchText(e.target.value);
  };

  const handlePaymentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentSearchText(e.target.value);
  };

  // Handle status filter changes
  const handleBookingStatusFilterChange = (value: string) => {
    setBookingStatusFilter(value);
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    setPaymentStatusFilter(value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  const successfulPayments = payments.filter(p => p.status === 'paid').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;
  const totalPaymentAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const bookingColumns: ColumnsType<Booking> = [
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 220,
      render: (userName: string, record: Booking) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ 
              marginRight: 12, 
              backgroundColor: '#7265e6' 
            }} 
          />
          <div>
            <div style={{ fontWeight: 500 }}>{userName}</div>
            <div style={{ color: '#8c8c8c', fontSize: '13px' }}>{record.userEmail}</div>
            {record.userPhone && record.userPhone !== 'N/A' && (
              <div style={{ color: '#8c8c8c', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                <PhoneOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                {record.userPhone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Ground & Owner',
      key: 'groundOwner',
      width: 220,
      render: (_, record: Booking) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {record.groundName}
          </div>
          {record.ownerName && record.ownerName !== 'N/A' && (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#8c8c8c',
                marginBottom: 2
              }}>
                <UserOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                {record.ownerName}
              </div>
              {record.ownerPhone && record.ownerPhone !== 'N/A' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#8c8c8c'
                }}>
                  <PhoneOutlined style={{ marginRight: 3, fontSize: '9px' }} />
                  {record.ownerPhone}
                </div>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date: string, record: Booking) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          {new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
          })} {record.time}
        </div>
      ),
    },
    {
      title: 'Duration (hrs)',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration: number) => `${duration} hour${duration > 1 ? 's' : ''}`,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount: number) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>Rs. {amount}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag 
          color={
            status === 'confirmed' ? 'green' : 
            status === 'cancelled' ? 'red' : 'orange'
          } 
          icon={status === 'confirmed' ? <CheckCircleOutlined /> : 
                status === 'cancelled' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
          style={{ padding: '5px 10px', borderRadius: 12 }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (paymentStatus: string) => (
        <Tag 
          color={
            paymentStatus === 'paid' ? 'green' : 
            paymentStatus === 'pending' ? 'orange' : 'red'
          } 
          icon={paymentStatus === 'paid' ? <CheckCircleOutlined /> : 
                paymentStatus === 'pending' ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
          style={{ padding: '5px 10px', borderRadius: 12 }}
        >
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => showBookingDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  const paymentColumns: ColumnsType<Payment> = [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 120,
      render: (transactionId: string) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {transactionId}
        </Text>
      ),
    },
    {
      title: 'Player',
      key: 'player',
      width: 200,
      render: (_, record: Payment) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            style={{ 
              marginRight: 8, 
              backgroundColor: '#7265e6' 
            }} 
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>
              {record.playerInfo.name || 'N/A'}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '11px' }}>
              {record.playerInfo.email}
            </div>
            {record.playerInfo.phone && record.playerInfo.phone !== 'N/A' && (
              <div style={{ color: '#8c8c8c', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
                <PhoneOutlined style={{ marginRight: 3, fontSize: '9px' }} />
                {record.playerInfo.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Ground & Owner',
      key: 'groundOwner',
      width: 220,
      render: (_, record: Payment) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {record.groundInfo.name}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '12px',
            color: '#8c8c8c',
            marginBottom: 2
          }}>
            <UserOutlined style={{ marginRight: 4, fontSize: '10px' }} />
            {record.ownerInfo.name}
          </div>
          {record.ownerInfo.phone && record.ownerInfo.phone !== 'N/A' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '11px',
              color: '#8c8c8c'
            }}>
              <PhoneOutlined style={{ marginRight: 3, fontSize: '9px' }} />
              {record.ownerInfo.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>Rs. {amount}</span>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CreditCardOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          <span style={{ textTransform: 'capitalize' }}>{method}</span>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dateTime',
      width: 180,
      render: (_, record: Payment) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          <div>
            <div>{new Date(record.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            })}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.time}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag 
          color={
            status === 'paid' ? 'green' : 
            status === 'failed' ? 'red' : 
            status === 'refunded' ? 'blue' : 'orange'
          } 
          icon={status === 'paid' ? <CheckCircleOutlined /> : 
                status === 'failed' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
          style={{ padding: '5px 10px', borderRadius: 12 }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => showPaymentDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      background: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          Monitor Bookings & Payments
        </Title>
        <Text type="secondary">
          Track and manage all bookings and payment transactions
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={totalBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Confirmed Bookings"
              value={confirmedBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={successfulPayments}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Payment Revenue"
              value={totalPaymentAmount}
              valueStyle={{ color: '#52c41a' }}
              precision={0}
              suffix="Rs."
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" type="card">
        <TabPane tab="Bookings" key="1">
          {/* Booking Filters */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                placeholder="Search bookings by user, email, phone, ground, or owner"
                value={bookingSearchText}
                onChange={handleBookingSearchChange}
                style={{ width: 350 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              
              <Select
                value={bookingStatusFilter}
                onChange={handleBookingStatusFilterChange}
                style={{ width: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="pending">Pending</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
              
              <RangePicker
                onChange={handleDateRangeChange}
                style={{ width: 250 }}
                placeholder={['Start Date', 'End Date']}
              />
            </div>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Text strong>Summary:</Text>
              <Text>Total: <Text strong>{bookings.length}</Text></Text>
              <Text>Confirmed: <Text strong style={{ color: '#52c41a' }}>{confirmedBookings}</Text></Text>
              <Text>Cancelled: <Text strong style={{ color: '#f5222d' }}>{cancelledBookings}</Text></Text>
              <Text>Filtered: <Text strong>{filteredBookings.length}</Text></Text>
            </div>
          </Card>

          {/* Bookings Table */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table 
              dataSource={filteredBookings} 
              columns={bookingColumns} 
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bookings`
              }}
              style={{ 
                border: '1px solid #f0f0f0',
                borderBottom: 'none',
              }}
              locale={{
                emptyText: bookingSearchText || bookingStatusFilter !== 'all' || dateRange.length > 0
                  ? 'No bookings match your filters' 
                  : 'No bookings found'
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Payments" key="2">
          {/* Payment Filters */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                placeholder="Search by transaction ID, method, player name/email/phone, ground, owner"
                value={paymentSearchText}
                onChange={handlePaymentSearchChange}
                style={{ width: 500 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              
              <Select
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilterChange}
                style={{ width: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="paid">Paid</Option>
                <Option value="pending">Pending</Option>
                <Option value="failed">Failed</Option>
                <Option value="refunded">Refunded</Option>
              </Select>
              
              <RangePicker
                onChange={handleDateRangeChange}
                style={{ width: 250 }}
                placeholder={['Start Date', 'End Date']}
              />
            </div>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Text strong>Summary:</Text>
              <Text>Total: <Text strong>{payments.length}</Text></Text>
              <Text>Successful: <Text strong style={{ color: '#52c41a' }}>{successfulPayments}</Text></Text>
              <Text>Failed: <Text strong style={{ color: '#f5222d' }}>{failedPayments}</Text></Text>
              <Text>Filtered: <Text strong>{filteredPayments.length}</Text></Text>
            </div>
          </Card>

          {/* Payments Table */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table 
              dataSource={filteredPayments} 
              columns={paymentColumns} 
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments`
              }}
              style={{
                border: '1px solid #f0f0f0',
                borderBottom: 'none',
              }}
              locale={{
                emptyText: paymentSearchText || paymentStatusFilter !== 'all' || dateRange.length > 0
                  ? 'No payments match your filters' 
                  : 'No payments found'
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={isBookingModalVisible}
        onCancel={handleBookingModalClose}
        footer={[
          <Button key="close" onClick={handleBookingModalClose}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedBooking && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Booking ID">{selectedBooking.id}</Descriptions.Item>
            <Descriptions.Item label="User">
              <div>
                <div style={{ fontWeight: 500 }}>{selectedBooking.userName}</div>
                <div style={{ color: '#8c8c8c', fontSize: '13px' }}>{selectedBooking.userEmail}</div>
                {selectedBooking.userPhone && selectedBooking.userPhone !== 'N/A' && (
                  <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 4, display: 'flex', alignItems: 'center' }}>
                    <PhoneOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                    {selectedBooking.userPhone}
                  </div>
                )}
                <div style={{ color: '#8c8c8c', fontSize: '12px', fontFamily: 'monospace', marginTop: 2 }}>
                  ID: {selectedBooking.userId}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Ground">
              <div>
                <div style={{ fontWeight: 500 }}>{selectedBooking.groundName}</div>
                {selectedBooking.groundAddress && (
                  <div style={{ color: '#8c8c8c', fontSize: '13px', marginTop: 4 }}>
                    {selectedBooking.groundAddress}
                  </div>
                )}
                <div style={{ color: '#8c8c8c', fontSize: '12px', fontFamily: 'monospace', marginTop: 2 }}>
                  ID: {selectedBooking.groundId}
                </div>
              </div>
            </Descriptions.Item>
            {(selectedBooking.ownerName && selectedBooking.ownerName !== 'N/A') && (
              <Descriptions.Item label="Ground Owner">
                <div>
                  <div style={{ fontWeight: 500 }}>{selectedBooking.ownerName}</div>
                  {selectedBooking.ownerEmail && selectedBooking.ownerEmail !== 'N/A' && (
                    <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                      {selectedBooking.ownerEmail}
                    </div>
                  )}
                  {selectedBooking.ownerPhone && selectedBooking.ownerPhone !== 'N/A' && (
                    <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 4, display: 'flex', alignItems: 'center' }}>
                      <PhoneOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                      {selectedBooking.ownerPhone}
                    </div>
                  )}
                  {selectedBooking.ownerId && (
                    <div style={{ color: '#8c8c8c', fontSize: '12px', fontFamily: 'monospace' }}>
                      ID: {selectedBooking.ownerId}
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Date">
              {new Date(selectedBooking.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Time">{selectedBooking.time}</Descriptions.Item>
            <Descriptions.Item label="Duration">{selectedBooking.duration} hours</Descriptions.Item>
            <Descriptions.Item label="Price Per Hour">
              Rs. {selectedBooking.pricePerHour}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              Rs. {selectedBooking.totalAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Booking Status">
              <Tag 
                color={
                  selectedBooking.status === 'confirmed' ? 'green' : 
                  selectedBooking.status === 'cancelled' ? 'red' : 'orange'
                }
              >
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag 
                color={
                  selectedBooking.paymentStatus === 'paid' ? 'green' : 
                  selectedBooking.paymentStatus === 'pending' ? 'orange' : 'red'
                }
              >
                {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {selectedBooking.createdAt?.toDate ? 
                selectedBooking.createdAt.toDate().toLocaleString() : 
                'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Payment Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CreditCardOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
            Payment Details
          </div>
        }
        open={isPaymentModalVisible}
        onCancel={handlePaymentModalClose}
        footer={[
          <Button key="close" onClick={handlePaymentModalClose}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedPayment && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Payment Information" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Transaction ID" span={2}>
                      <Text code style={{ fontSize: '14px' }}>{selectedPayment.transactionId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                        Rs. {selectedPayment.amount}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                        {selectedPayment.paymentMethod}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag 
                        color={
                          selectedPayment.status === 'paid' ? 'green' : 
                          selectedPayment.status === 'failed' ? 'red' : 'orange'
                        }
                        icon={
                          selectedPayment.status === 'paid' ? <CheckCircleOutlined /> : 
                          selectedPayment.status === 'failed' ? <CloseCircleOutlined /> : 
                          <ClockCircleOutlined />
                        }
                      >
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Date">
                      {new Date(selectedPayment.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </Descriptions.Item>
                    <Descriptions.Item label="Time Slot">
                      {selectedPayment.time}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At" span={2}>
                      {new Date(selectedPayment.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Player Information" size="small">
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Name">
                      {selectedPayment.playerInfo.name || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedPayment.playerInfo.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {selectedPayment.playerInfo.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Player ID">
                      <Text code style={{ fontSize: '12px' }}>
                        {selectedPayment.playerInfo.id}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Ground Information" size="small">
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Ground Name">
                      {selectedPayment.groundInfo.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {selectedPayment.groundInfo.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ground ID">
                      <Text code style={{ fontSize: '12px' }}>
                        {selectedPayment.groundId}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Owner Information" size="small">
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Owner Name">
                      {selectedPayment.ownerInfo.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Owner Email">
                      {selectedPayment.ownerInfo.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Owner Phone">
                      {selectedPayment.ownerInfo.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Owner ID">
                      <Text code style={{ fontSize: '12px' }}>
                        {selectedPayment.ownerInfo.id}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <PictureOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
                      Payment Screenshot
                    </div>
                  } 
                  size="small"
                >
                  {selectedPayment.screenshotUrl ? (
                    <div style={{ textAlign: 'center' }}>
                      <Image
                        width="100%"
                        height={200}
                        src={selectedPayment.screenshotUrl}
                        alt="Payment Screenshot"
                        style={{ 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #f0f0f0'
                        }}
                        placeholder={
                          <div style={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: '#fafafa'
                          }}>
                            <Spin />
                          </div>
                        }
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnH8W+1eCG26kTwSHyxvV3rYkO/Q3AvmYEjxAV4FEhFuYREgLKaKM4RXVqy/gMR3QAYQ4Aa7D3A6l29Qx3wC6DmAD7YqHSk8nEkkAx3Q+9Az2zPdE93T/+e979Pd8/0dO+0RPdMjUkZ/e/K6kYXLCZI1+Q7Km2u7lNPBzPUTNdlrIVx+EDBFplCdLdKtL1kzXkRxGNzfzZJAOTG/R4W1KP1YzNJ9+xzfVNlWNiMGnSPJ2KQBP8TJaA3F6qgQNvIIGomQBIGmk+5uRp0UJNGcWEj2LkYdMN7fCkTr/C26SJfNRzTLvlSAC2z+V6MbWfzUxGE37kEU/pEE0ZxYSfcupqEhqsNIzcrTZj8qv6hI1rF/1XLCDaqlF8g1L5fChT6UvTCYvZ3VBfClkKHD8CxvmMCPPvfBDUDuKJa2hq5wLTffgHuJrEIZ9h4v4bLn4nzwUZXQcLRgdCPhhZO+vLDfJ/iVmg9ZAcLTJ/5qyTWj2OVQO9sAx2u/VIFGGhSKgCQg2jCZEMR8MmSGfRFxz0P+o/5HG2hH8fYZUCFwc7+WZgRGzKl6LWJXvKYUDNz5Lnbu9oeUaENBb3KPQDI5Q1IHq1P6Qv1K6hn3CfPYcS"
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => window.open(selectedPayment.screenshotUrl, '_blank')}
                        >
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 0',
                      color: '#8c8c8c'
                    }}>
                      <PictureOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
                      <div>No screenshot available</div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MonitorBookings;