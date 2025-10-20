import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Typography,
  Space,
  message,
  Card,
  Tag,
  Avatar,
  Badge,
  Modal,
  Spin,
  Input,
  Grid,
  Tooltip,
  Image,
  Row,
  Col,
  Select,
  type InputRef,
  Dropdown,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  FileImageOutlined,
  IdcardOutlined,
  HomeOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { Owner } from '../types';
import { db } from '../../firebaseconfig';
import {
  getDocs,
  collection,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from 'firebase/firestore';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Extend the Owner type to include new properties
interface ExtendedOwner extends Owner {
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  cnicFrontImage?: string;
  cnicBackImage?: string;
  groundImages?: string[];
  documentsUploaded?: boolean;
  groundName?: string;
  groundLocation?: string;
}

const OwnerApprovals: React.FC = () => {
  const [owners, setOwners] = useState<ExtendedOwner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<ExtendedOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewReasonModalVisible, setViewReasonModalVisible] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<ExtendedOwner | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [ownerDetails, setOwnerDetails] = useState<ExtendedOwner | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageType, setCurrentImageType] = useState<string>('');
  
  // Filter and search states
  const [searchText, setSearchText] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('all');
  const [documentStatusFilter, setDocumentStatusFilter] = useState<string>('all');
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  // Horizontal scroll state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  
  const screens = useBreakpoint();
  const searchInputRef = React.useRef<InputRef>(null);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const ownersQuery = query(usersCollection, where('role', '==', 'owner'));
      const ownersSnapshot = await getDocs(ownersQuery);
      
      const ownersList: ExtendedOwner[] = [];
      
      for (const docSnapshot of ownersSnapshot.docs) {
        const data = docSnapshot.data();
        const ownerData: ExtendedOwner = {
          id: docSnapshot.id,
          user: {
            id: docSnapshot.id,
            email: data.email,
            role: data.role,
            name: data.name || data.email.split('@')[0],
            profilePicture: data.profilePicture,
            suspended: data.suspended,
            joinDate: data.createdAt?.toDate()
          },
          registrationDate: data.createdAt?.toDate() || new Date(),
          approvalStatus: data.approvalStatus || 'pending',
          rejectionReason: data.rejectionReason || '',
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          cnicFrontImage: data.cnicFrontImage,
          cnicBackImage: data.cnicBackImage,
          groundImages: data.groundImages || [],
          documentsUploaded: data.documentsUploaded || false,
          groundName: data.groundName || '',
          groundLocation: data.groundLocation || ''
        };
        ownersList.push(ownerData);
      }
      
      setOwners(ownersList);
      setFilteredOwners(ownersList);
    } catch (error) {
      console.error('Error fetching owners:', error);
      message.error('Failed to fetch owners data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate max scroll when table data changes
  useEffect(() => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const table = container.querySelector('.ant-table-content');
      if (table) {
        setMaxScroll(table.scrollWidth - container.clientWidth);
      }
    }
  }, [filteredOwners, screens]);

  // Apply filters and search
  useEffect(() => {
    let result = owners;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(owner =>
        owner.user.name.toLowerCase().includes(searchLower) ||
        owner.user.email.toLowerCase().includes(searchLower) ||
        owner.user.id.toLowerCase().includes(searchLower) ||
        (owner.groundName && owner.groundName.toLowerCase().includes(searchLower)) ||
        (owner.groundLocation && owner.groundLocation.toLowerCase().includes(searchLower))
      );
    }

    // Apply approval status filter
    if (approvalStatusFilter !== 'all') {
      result = result.filter(owner => owner.approvalStatus === approvalStatusFilter);
    }

    // Apply document status filter
    if (documentStatusFilter !== 'all') {
      const hasDocuments = documentStatusFilter === 'uploaded';
      result = result.filter(owner => owner.documentsUploaded === hasDocuments);
    }

    setFilteredOwners(result);
    
    // Check if any filter is active
    const hasActiveFilters = 
      searchText.trim() !== '' || 
      approvalStatusFilter !== 'all' || 
      documentStatusFilter !== 'all';
    setIsFilterActive(hasActiveFilters);
  }, [owners, searchText, approvalStatusFilter, documentStatusFilter]);

  const fetchOwnerDetails = async (ownerId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', ownerId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const ownerDetail: ExtendedOwner = {
          id: userDoc.id,
          user: {
            id: userDoc.id,
            email: data.email,
            role: data.role,
            name: data.name || data.email.split('@')[0],
            profilePicture: data.profilePicture,
            suspended: data.suspended,
            joinDate: data.createdAt?.toDate()
          },
          registrationDate: data.createdAt?.toDate() || new Date(),
          approvalStatus: data.approvalStatus || 'pending',
          rejectionReason: data.rejectionReason || '',
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          cnicFrontImage: data.cnicFrontImage,
          cnicBackImage: data.cnicBackImage,
          groundImages: data.groundImages || [],
          documentsUploaded: data.documentsUploaded || false,
          groundName: data.groundName || '',
          groundLocation: data.groundLocation || ''
        };
        setOwnerDetails(ownerDetail);
      }
    } catch (error) {
      console.error('Error fetching owner details:', error);
      message.error('Failed to fetch owner details');
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const approveOwner = async (id: string) => {
    try {
      const userDoc = doc(db, 'users', id);
      await updateDoc(userDoc, {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        rejectionReason: '' // Clear rejection reason if any
      });

      // Update local state to reflect the change
      setOwners((prev) =>
        prev.map((owner) => 
          owner.id === id ? { 
            ...owner, 
            approvalStatus: 'approved',
            approvedAt: new Date(),
            rejectionReason: ''
          } : owner
        )
      );
      message.success('Owner approved successfully');
    } catch (error) {
      console.error('Error approving owner:', error);
      message.error('Failed to approve owner');
    }
  };

  const rejectOwner = (id: string) => {
    setSelectedOwnerId(id);
    setIsRejectModalVisible(true);
  };

  const viewRejectionReason = (owner: ExtendedOwner) => {
    setSelectedOwner(owner);
    setViewReasonModalVisible(true);
  };

  const viewOwnerDetails = async (ownerId: string) => {
    await fetchOwnerDetails(ownerId);
    setDetailModalVisible(true);
  };

  const showImageViewer = (images: string[], type: string, index: number = 0) => {
    setCurrentImages(images);
    setCurrentImageType(type);
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (selectedOwnerId && rejectionReason.trim()) {
      try {
        const userDoc = doc(db, 'users', selectedOwnerId);
        await updateDoc(userDoc, {
          approvalStatus: 'rejected',
          rejectionReason: rejectionReason.trim(),
          rejectedAt: new Date()
        });

        // Update local state instead of filtering out
        setOwners(prevOwners => 
          prevOwners.map(owner => 
            owner.id === selectedOwnerId ? { 
              ...owner, 
              approvalStatus: 'rejected',
              rejectionReason: rejectionReason.trim(),
              rejectedAt: new Date()
            } : owner
          )
        );
        message.info('Owner registration rejected');
        setIsRejectModalVisible(false);
        setSelectedOwnerId(null);
        setRejectionReason('');
      } catch (error) {
        console.error('Error rejecting owner:', error);
        message.error('Failed to reject owner');
      }
    } else {
      message.error('Please provide a rejection reason');
    }
  };

  const handleRejectCancel = () => {
    setIsRejectModalVisible(false);
    setSelectedOwnerId(null);
    setRejectionReason('');
  };

  const handleViewReasonCancel = () => {
    setViewReasonModalVisible(false);
    setSelectedOwner(null);
  };

  const handleDetailModalCancel = () => {
    setDetailModalVisible(false);
    setOwnerDetails(null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText('');
    setApprovalStatusFilter('all');
    setDocumentStatusFilter('all');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(event.currentTarget.scrollLeft);
  };

  // Define responsive columns
  const getColumns = () => {
    const actionColumn = {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: screens.xs ? 140 : 200,
      render: (_: any, record: ExtendedOwner) => {
        const isPending = record.approvalStatus === 'pending';
        const isApproved = record.approvalStatus === 'approved';
        const isRejected = record.approvalStatus === 'rejected';

        // Dropdown menu for mobile view
        const dropdownMenu = {
          items: [
            {
              key: 'view-details',
              icon: <InfoCircleOutlined />,
              label: 'View Details',
              onClick: () => viewOwnerDetails(record.id),
            },
            {
              key: 'approve',
              icon: <CheckOutlined />,
              label: 'Approve',
              onClick: () => approveOwner(record.id),
              disabled: !isPending,
            },
            {
              key: 'reject',
              icon: <CloseOutlined />,
              label: 'Reject',
              onClick: () => rejectOwner(record.id),
              disabled: !isPending,
              danger: true,
            },
          ],
        };

        if (screens.xs) {
          return (
            <Dropdown menu={dropdownMenu} placement="bottomRight" trigger={['click']}>
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                size="small"
                style={{
                  borderRadius: 6,
                  border: '1px solid #d9d9d9',
                  width: '100%'
                }}
              >
                Actions
              </Button>
            </Dropdown>
          );
        }

        return (
          <Space size="small" direction="horizontal" wrap>
            {/* View Details Button */}
            <Tooltip title="View full details">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                onClick={() => viewOwnerDetails(record.id)}
                size="small"
                style={{
                  borderRadius: 6,
                  border: '1px solid #d9d9d9',
                  color: '#4F46E5',
                  background: 'transparent',
                  padding: '4px 8px',
                  height: 'auto'
                }}
              />
            </Tooltip>

            {/* Approve Button */}
            <Tooltip title={isPending ? "Approve this owner" : isApproved ? "Already approved" : "Cannot approve rejected owner"}>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => approveOwner(record.id)}
                disabled={!isPending}
                size="small"
                style={{
                  borderRadius: 6,
                  border: isApproved ? 'none' : '1px solid #52c41a',
                  color: isApproved ? '#ffffff' : '#52c41a',
                  background: isApproved ? '#52c41a' : 'transparent',
                  padding: '4px 8px',
                  height: 'auto',
                  opacity: isPending ? 1 : 0.6
                }}
              />
            </Tooltip>

            {/* Reject Button */}
            <Tooltip title={isPending ? "Reject this owner" : isRejected ? "Already rejected" : "Cannot reject approved owner"}>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => rejectOwner(record.id)}
                disabled={!isPending}
                size="small"
                style={{
                  borderRadius: 6,
                  border: isRejected ? 'none' : '1px solid #ff4d4f',
                  color: isRejected ? '#ffffff' : '#ff4d4f',
                  background: isRejected ? '#ff4d4f' : 'transparent',
                  padding: '4px 8px',
                  height: 'auto',
                  opacity: isPending ? 1 : 0.6
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    };

    const baseColumns = [
      {
        title: 'Owner',
        dataIndex: 'user',
        key: 'user',
        fixed: 'left',
        width: screens.xs ? 150 : 200,
        render: (user: any) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={screens.xs ? "default" : "large"} 
              icon={<UserOutlined />} 
              style={{ marginRight: screens.xs ? 8 : 12, backgroundColor: '#7265e6' }} 
            />
            <div>
              <div style={{ fontWeight: 500, fontSize: screens.xs ? '12px' : '14px' }}>
                {user.name}
              </div>
              {!screens.xs && (
                <div style={{ color: '#8c8c8c', fontSize: '13px' }}>ID: {user.id.substring(0, 8)}...</div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'Email',
        dataIndex: ['user', 'email'],
        key: 'email',
        width: 250,
        render: (email: string) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MailOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
            <span style={{ fontSize: screens.xs ? '12px' : '14px' }}>{email}</span>
          </div>
        ),
      },
      {
        title: 'Ground Name',
        dataIndex: 'groundName',
        key: 'groundName',
        width: 200,
        render: (groundName: string) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShopOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
            <span style={{ 
              fontSize: screens.xs ? '12px' : '14px',
              fontWeight: groundName ? 500 : 'normal',
              color: groundName ? '#262626' : '#8c8c8c'
            }}>
              {groundName || 'Not provided'}
            </span>
          </div>
        ),
      },
      {
        title: 'Ground Location',
        dataIndex: 'groundLocation',
        key: 'groundLocation',
        width: 220,
        render: (location: string) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            <span style={{ 
              fontSize: screens.xs ? '12px' : '14px',
              fontWeight: location ? 500 : 'normal',
              color: location ? '#262626' : '#8c8c8c'
            }}>
              {location || 'Not provided'}
            </span>
          </div>
        ),
      },
      {
        title: 'Registration Date',
        dataIndex: 'registrationDate',
        key: 'registrationDate',
        width: 180,
        render: (date: any) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            <span style={{ fontSize: screens.xs ? '12px' : '14px' }}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        ),
      },
      {
        title: 'Documents',
        key: 'documents',
        width: 140,
        render: (_: any, record: ExtendedOwner) => (
          <Tag
            color={record.documentsUploaded ? 'green' : 'orange'}
            icon={<FileImageOutlined />}
            style={{ 
              padding: '4px 8px', 
              borderRadius: 12, 
              fontSize: '12px',
              margin: 0,
              border: 'none'
            }}
          >
            {record.documentsUploaded ? 'Uploaded' : 'Pending'}
          </Tag>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 180,
        render: (_: any, record: ExtendedOwner) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tag
              color={record.approvalStatus === 'approved' ? 'green' : record.approvalStatus === 'rejected' ? 'red' : 'orange'}
              icon={record.approvalStatus === 'approved' ? <SafetyCertificateOutlined /> : null}
              style={{ 
                padding: '4px 8px', 
                borderRadius: 12, 
                fontSize: screens.xs ? '11px' : '12px',
                margin: 0,
                border: 'none'
              }}
            >
              {record.approvalStatus === 'approved' ? 'Approved' : record.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
            </Tag>
            {record.approvalStatus === 'rejected' && record.rejectionReason && (
              <Tooltip title="View rejection reason">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  size="small" 
                  onClick={() => viewRejectionReason(record)}
                  style={{ 
                    marginLeft: 8,
                    color: '#ff4d4f',
                    border: '1px solid #ff4d4f',
                    borderRadius: 6
                  }}
                />
              </Tooltip>
            )}
          </div>
        ),
      },
      actionColumn,
    ];

    return baseColumns as any;
  };

  const pendingCount = owners.filter(owner => owner.approvalStatus === 'pending').length;
  const filteredPendingCount = filteredOwners.filter(owner => owner.approvalStatus === 'pending').length;

  return (
    <div style={{ 
      padding: screens.xs ? 12 : 24, 
      background: '#f0f2f5',
      minHeight: '100%'
    }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: screens.xs ? '20px' : '24px' }}>
          Owner Approvals
          <Badge 
            count={pendingCount} 
            style={{ 
              marginLeft: 12,
              backgroundColor: '#4F46E5'
            }} 
          />
        </Title>
        <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
          Review and approve property owner registrations
        </Text>
      </div>

      {/* Filter and Search Section */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: 16,
          background: isFilterActive ? '#f6ffed' : 'white'
        }}
        bodyStyle={{ padding: screens.xs ? 16 : 20 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              ref={searchInputRef}
              placeholder="Search by name, email, ground name or location..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size={screens.xs ? "middle" : "large"}
            />
          </Col>
          
          <Col xs={12} sm={6} md={5} lg={4}>
            <Select
              placeholder="Approval Status"
              value={approvalStatusFilter}
              onChange={setApprovalStatusFilter}
              style={{ width: '100%' }}
              size={screens.xs ? "middle" : "large"}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          
          <Col xs={12} sm={6} md={5} lg={4}>
            <Select
              placeholder="Document Status"
              value={documentStatusFilter}
              onChange={setDocumentStatusFilter}
              style={{ width: '100%' }}
              size={screens.xs ? "middle" : "large"}
              suffixIcon={<FileImageOutlined />}
            >
              <Option value="all">All Documents</Option>
              <Option value="uploaded">Uploaded</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={8} lg={10}>
            <Space style={{ width: '100%', justifyContent: screens.md ? 'flex-end' : 'flex-start' }} wrap>
              {isFilterActive && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  size={screens.xs ? "middle" : "large"}
                >
                  Clear Filters
                </Button>
              )}
              
              <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                Showing {filteredOwners.length} of {owners.length} owners
                {filteredPendingCount > 0 && (
                  <span style={{ color: '#4F46E5', marginLeft: 8 }}>
                    ({filteredPendingCount} pending)
                  </span>
                )}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Owners Table with Horizontal Scroll */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          <div 
            ref={tableContainerRef}
            style={{ 
              overflowX: 'auto',
              overflowY: 'hidden',
              position: 'relative'
            }}
            onScroll={handleScroll}
          >
            <Table
              dataSource={filteredOwners}
              columns={getColumns()}
              rowKey="id"
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showQuickJumper: true,
                style: { marginRight: 16 },
                size: screens.xs ? 'small' : 'default'
              }}
              scroll={{ x: 1500 }}
              style={{ 
                border: '1px solid #f0f0f0', 
                borderBottom: 'none',
                minWidth: '100%'
              }}
              locale={{ emptyText: 
                isFilterActive ? 
                  'No owners match your filters. Try adjusting your search criteria.' : 
                  'No owner registrations found' 
              }}
            />
          </div>
        </Spin>
      </Card>

      {/* Scroll position indicator */}
      {maxScroll > 0 && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginRight: 12 }}>
            Scroll position: {Math.round((scrollPosition / maxScroll) * 100)}%
          </Text>
          <div style={{ 
            flex: 1, 
            height: 4, 
            backgroundColor: '#f0f0f0', 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: '#4F46E5',
                width: `${(scrollPosition / maxScroll) * 100}%`,
                transition: 'width 0.2s ease'
              }} 
            />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        title="Confirm Rejection"
        open={isRejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="Confirm Rejection"
        okType="danger"
        cancelText="Cancel"
        width={screens.xs ? '90%' : 520}
      >
        <p>Are you sure you want to reject this owner registration?</p>
        <TextArea
          placeholder="Please provide a reason for rejection"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={4}
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* View Rejection Reason Modal */}
      <Modal
        title="Rejection Reason"
        open={viewReasonModalVisible}
        onCancel={handleViewReasonCancel}
        footer={[
          <Button key="close" onClick={handleViewReasonCancel}>
            Close
          </Button>
        ]}
        width={screens.xs ? '90%' : 520}
      >
        {selectedOwner && (
          <div>
            <p><strong>Owner:</strong> {selectedOwner.user.name}</p>
            <p><strong>Rejection Reason:</strong></p>
            <TextArea
              value={selectedOwner.rejectionReason || ''}
              rows={4}
              readOnly
            />
            <p style={{ marginTop: 16, color: '#8c8c8c' }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Rejected on: {selectedOwner.rejectedAt?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </Modal>

      {/* Owner Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
            Owner Details
          </div>
        }
        open={detailModalVisible}
        onCancel={handleDetailModalCancel}
        footer={[
          <Button key="close" onClick={handleDetailModalCancel}>
            Close
          </Button>
        ]}
        width={screens.xs ? '95%' : 800}
        style={{ top: 20 }}
      >
        {ownerDetails && (
          <div>
            {/* Basic Information */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                <UserOutlined style={{ marginRight: 8 }} />
                Basic Information
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Name:</strong> {ownerDetails.user.name}</p>
                  <p><strong>Email:</strong> {ownerDetails.user.email}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Registration Date:</strong> {ownerDetails.registrationDate.toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <Tag
                      color={ownerDetails.approvalStatus === 'approved' ? 'green' : ownerDetails.approvalStatus === 'rejected' ? 'red' : 'orange'}
                      style={{ marginLeft: 8 }}
                    >
                      {ownerDetails.approvalStatus}
                    </Tag>
                  </p>
                </Col>
              </Row>
            </Card>

            {/* Ground Information */}
            {(ownerDetails.groundName || ownerDetails.groundLocation) && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                  <ShopOutlined style={{ marginRight: 8 }} />
                  Ground Information
                </Title>
                <Row gutter={16}>
                  {ownerDetails.groundName && (
                    <Col span={24} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <ShopOutlined style={{ marginRight: 8, color: '#fa8c16', marginTop: 4 }} />
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>Ground Name</div>
                          <div style={{ color: '#262626' }}>{ownerDetails.groundName}</div>
                        </div>
                      </div>
                    </Col>
                  )}
                  {ownerDetails.groundLocation && (
                    <Col span={24}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a', marginTop: 4 }} />
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>Ground Location</div>
                          <div style={{ color: '#262626' }}>{ownerDetails.groundLocation}</div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* CNIC Images */}
            {(ownerDetails.cnicFrontImage || ownerDetails.cnicBackImage) && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                  <IdcardOutlined style={{ marginRight: 8 }} />
                  CNIC Images
                </Title>
                <Row gutter={16}>
                  {ownerDetails.cnicFrontImage && (
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: 8, fontWeight: 500 }}>Front Side</p>
                        <Image
                          width="100%"
                          height={150}
                          src={ownerDetails.cnicFrontImage}
                          style={{ 
                            objectFit: 'cover', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            border: '1px solid #d9d9d9'
                          }}
                          preview={{
                            visible: false
                          }}
                          onClick={() => showImageViewer([ownerDetails.cnicFrontImage!], 'CNIC Front', 0)}
                        />
                      </div>
                    </Col>
                  )}
                  {ownerDetails.cnicBackImage && (
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: 8, fontWeight: 500 }}>Back Side</p>
                        <Image
                          width="100%"
                          height={150}
                          src={ownerDetails.cnicBackImage}
                          style={{ 
                            objectFit: 'cover', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            border: '1px solid #d9d9d9'
                          }}
                          preview={{
                            visible: false
                          }}
                          onClick={() => showImageViewer([ownerDetails.cnicBackImage!], 'CNIC Back', 0)}
                        />
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* Ground Images */}
            {ownerDetails.groundImages && ownerDetails.groundImages.length > 0 && (
              <Card size="small">
                <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                  <HomeOutlined style={{ marginRight: 8 }} />
                  Ground Images ({ownerDetails.groundImages.length})
                </Title>
                <Row gutter={[16, 16]}>
                  {ownerDetails.groundImages.map((image, index) => (
                    <Col span={screens.xs ? 24 : 8} key={index}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: 8, fontWeight: 500 }}>Ground Image {index + 1}</p>
                        <Image
                          width="100%"
                          height={150}
                          src={image}
                          style={{ 
                            objectFit: 'cover', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            border: '1px solid #d9d9d9'
                          }}
                          preview={{
                            visible: false
                          }}
                          onClick={() => showImageViewer(ownerDetails.groundImages!, 'Ground Images', index)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

            {/* No documents message */}
            {!ownerDetails.documentsUploaded && (
              <Card size="small" style={{ textAlign: 'center', color: '#8c8c8c' }}>
                <FileImageOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <p>No documents uploaded yet</p>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        title={`${currentImageType} - Image ${currentImageIndex + 1} of ${currentImages.length}`}
        open={imageViewerVisible}
        onCancel={() => setImageViewerVisible(false)}
        footer={[
          <Space key="navigation">
            <Button 
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
            >
              Previous
            </Button>
            <Button 
              onClick={() => setCurrentImageIndex(Math.min(currentImages.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === currentImages.length - 1}
            >
              Next
            </Button>
            <Button onClick={() => setImageViewerVisible(false)}>
              Close
            </Button>
          </Space>
        ]}
        width={screens.xs ? '95%' : '80%'}
        style={{ top: 20 }}
        bodyStyle={{ textAlign: 'center', padding: 24 }}
      >
        {currentImages.length > 0 && (
          <Image
            src={currentImages[currentImageIndex]}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
            preview={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default OwnerApprovals;