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
  Input,
  Select,
  Descriptions,
  Tabs,
  Divider,
  Grid,
  Row,
  Col
} from 'antd';
import type { ColumnType } from 'antd/es/table';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { db } from '../../firebaseconfig'; // Your Firebase config
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

// Define types
interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'player' | 'owner';
}

interface Complaint {
  id: string;
  user: UserInfo;
  opponent?: UserInfo;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  type: string;
  groundId?: string;
  groundName?: string;
  collectionType: 'player_complaints' | 'owner_complaints';
}

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const screens = useBreakpoint();

  // Fetch complaints from Firestore
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // Fetch player complaints
      const playerComplaintsSnapshot = await getDocs(collection(db, 'player_complaints'));
      const playerComplaints = playerComplaintsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: {
            id: data.playerId || '',
            email: data.playerEmail,
            name: data.playerName || data.playerEmail,
            role: 'player' as const
          },
          opponent: data.ownerId && data.ownerName ? {
            id: data.ownerId,
            email: data.ownerEmail || data.ownerName,
            name: data.ownerName,
            role: 'owner' as const
          } : data.ownerName ? {
            id: '',
            email: data.ownerName,
            name: data.ownerName,
            role: 'owner' as const
          } : undefined,
          description: data.description,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          type: data.type,
          groundId: data.groundId,
          groundName: data.groundName,
          collectionType: 'player_complaints' as const
        };
      });

      // Fetch owner complaints
      const ownerComplaintsSnapshot = await getDocs(collection(db, 'owner_complaints'));
      const ownerComplaints = ownerComplaintsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: {
            id: data.ownerId,
            email: data.ownerEmail || data.ownerName,
            name: data.ownerName,
            role: 'owner' as const
          },
          opponent: data.playerEmail && data.playerName ? {
            id: data.playerId || '',
            email: data.playerEmail,
            name: data.playerName,
            role: 'player' as const
          } : undefined,
          description: data.description,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          type: data.type,
          groundId: data.groundId,
          groundName: data.groundName,
          collectionType: 'owner_complaints' as const
        };
      });

      // Combine all complaints
      const allComplaints = [...playerComplaints, ...ownerComplaints];
      setComplaints(allComplaints);
      setFilteredComplaints(allComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      message.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Apply filters whenever search text or filters change
  useEffect(() => {
    applyFilters();
  }, [searchText, statusFilter, typeFilter, roleFilter, complaints, activeTab]);

  // Filter complaints based on search text, status, type, and role
  const applyFilters = () => {
    let result = [...complaints];
    
    // Apply tab filter
    if (activeTab !== 'all') {
      result = result.filter(complaint => complaint.status === activeTab);
    }
    
    // Apply search filter
    if (searchText) {
      result = result.filter(complaint => 
        complaint.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        complaint.user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (complaint.opponent && complaint.opponent.email && complaint.opponent.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (complaint.opponent && complaint.opponent.name && complaint.opponent.name.toLowerCase().includes(searchText.toLowerCase())) ||
        complaint.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (complaint.groundName && complaint.groundName.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(complaint => complaint.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(complaint => complaint.type === typeFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(complaint => complaint.user.role === roleFilter);
    }
    
    setFilteredComplaints(result);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle type filter change
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setTypeFilter('all');
    setRoleFilter('all');
    setActiveTab('all');
  };

  // Update complaint status in Firestore
  const updateComplaintStatus = async (complaintId: string, collectionType: string, status: string, note: string = '') => {
    try {
      const complaintRef = doc(db, collectionType, complaintId);
      await updateDoc(complaintRef, {
        status,
        resolvedAt: status === 'resolved' ? Timestamp.now() : null,
        adminNote: note,
        reviewedByAdmin: true
      });
      
      // Update local state
      setComplaints(prev => 
        prev.map(c => 
          c.id === complaintId && c.collectionType === collectionType 
            ? { 
                ...c, 
                status: status as any,
                resolvedAt: status === 'resolved' ? new Date() : c.resolvedAt
              } 
            : c
        )
      );
      
      message.success(`Complaint ${status} successfully`);
      return true;
    } catch (error) {
      console.error('Error updating complaint:', error);
      message.error('Failed to update complaint');
      return false;
    }
  };

  const resolveComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setActionVisible(true);
  };

  // Removed escalateComplaint function as escalate button is removed

  const handleActionConfirm = async () => {
    if (selectedComplaint) {
      const success = await updateComplaintStatus(
        selectedComplaint.id, 
        selectedComplaint.collectionType, 
        'resolved', 
        actionNote
      );
      
      if (success) {
        setActionVisible(false);
        setActionNote('');
        setSelectedComplaint(null);
      }
    }
  };

  const handleActionCancel = () => {
    setActionVisible(false);
    setActionNote('');
    setSelectedComplaint(null);
  };

  const viewComplaintDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailVisible(true);
  };

  const closeDetails = () => {
    setDetailVisible(false);
    setSelectedComplaint(null);
  };

  const columns: ColumnType<Complaint>[] = [
    {
      title: 'Complaint From',
      dataIndex: 'user',
      key: 'user',
      width: screens.xs ? 150 : 200,
     render: (user: UserInfo, _record: Complaint) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div>
      <div style={{ fontWeight: 500, fontSize: screens.xs ? '12px' : '14px' }}>{user.name}</div>
      <div style={{ color: '#8c8c8c', fontSize: screens.xs ? '11px' : '13px' }}>
        {user.role.toUpperCase()} • {screens.xs ? user.email.split('@')[0] + '...' : user.email}
      </div>
    </div>
  </div>
),
    },
    {
      title: 'Against',
      dataIndex: 'opponent',
      key: 'opponent',
      width: screens.xs ? 120 : 200,
    render: (opponent: UserInfo | undefined, _record: Complaint) => (
  opponent && opponent.name ? (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: screens.xs ? '12px' : '14px' }}>{opponent.name}</div>
        <div style={{ color: '#8c8c8c', fontSize: screens.xs ? '11px' : '12px' }}>
          {opponent.role.toUpperCase()}
        </div>
      </div>
    </div>
  ) : (
    <Text type="secondary" style={{ fontSize: screens.xs ? '11px' : '14px' }}>Not specified</Text>
  )
),
    },
    {
      title: 'Ground',
      dataIndex: 'groundName',
      key: 'groundName',
      width: screens.xs ? 100 : 150,
      render: (groundName: string | undefined, _record: Complaint) => (
        groundName ? (
          <Tag color="blue" style={{ padding: '4px 8px', borderRadius: 12, fontSize: screens.xs ? '11px' : '14px' }}>
            {screens.xs ? groundName.substring(0, 8) + '...' : groundName}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: screens.xs ? '11px' : '14px' }}>Not specified</Text>
        )
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: screens.xs ? 100 : 150,
      render: (type: string, _record: Complaint) => (
        <Tag 
          color={
            type === 'payment_issue' ? 'red' : 
            type === 'booking_issue' ? 'orange' :
            type === 'facility_issue' ? 'blue' : 
            type === 'behavior_issue' ? 'volcano' : 'purple'
          }
          style={{ padding: '4px 8px', borderRadius: 12, textTransform: 'capitalize', fontSize: screens.xs ? '11px' : '14px' }}
        >
          {screens.xs ? type.split('_')[0] : type.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: screens.xs ? 80 : 140,
      render: (description: string, _record: Complaint) => (
        <div style={{
          maxWidth: screens.xs ? 80 : 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: screens.xs ? '11px' : '14px'
        }}>
          {description}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: screens.xs ? 80 : 120,
      render: (status: string, _record: Complaint) => (
        <Tag
          color={
            status === 'resolved' ? 'green' : 'orange'
          }
          icon={status === 'resolved' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          style={{ padding: '4px 8px', borderRadius: 12, fontSize: screens.xs ? '11px' : '14px' }}
        >
          {screens.xs ? status.charAt(0).toUpperCase() : status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: screens.xs ? 100 : 150,
      render: (date: Date) => (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: screens.xs ? '11px' : '14px' }}>
          <CalendarOutlined style={{ marginRight: 4, color: '#4F46E5', fontSize: screens.xs ? '11px' : '14px' }} />
          {screens.xs ? (
            date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })
          ) : (
            date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: screens.xs ? 120 : 200,
      render: (_: any, record: Complaint) => (
        <Space size={screens.xs ? "small" : "middle"} direction={screens.xs ? "vertical" : "horizontal"}>
          <Button 
            size={screens.xs ? "small" : "middle"}
            icon={<EyeOutlined />}
            onClick={() => viewComplaintDetails(record)}
          >
            {screens.xs ? '' : 'Details'}
          </Button>
          {record.status === 'pending' && (
            <>
              <Button 
                size={screens.xs ? "small" : "middle"}
                type="primary" 
                icon={<SafetyCertificateOutlined />}
                onClick={() => resolveComplaint(record)}
              >
                {screens.xs ? '' : 'Resolve'}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  // Removed escalatedCount as escalated status is removed

  return (
    <div style={{ 
      padding: screens.xs ? 12 : 24, 
      background: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: screens.xs ? 16 : 24 }}>
        <Title level={screens.xs ? 4 : 2} style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          Complaint Management
          <Badge 
            count={complaints.length} 
            style={{ 
              marginLeft: 8,
              backgroundColor: '#4F46E5'
            }} 
          />
        </Title>
        <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
          Manage and resolve complaints from players and ground owners
        </Text>
      </div>

      {/* Filters */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: screens.xs ? 16 : 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflowX: 'auto',
          padding: screens.xs ? 8 : 16,
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Row gutter={[12, 12]} wrap={false} style={{ minWidth: 700 }}>
          <Col flex="auto" style={{ minWidth: 200 }}>
            <Input
              placeholder="Search complaints by user, email, ground, or description"
              value={searchText}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              allowClear
              size={screens.xs ? "small" : "middle"}
              style={{ width: '100%' }}
            />
          </Col>
          <Col flex="120px">
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              size={screens.xs ? "small" : "middle"}
              style={{ width: '100%' }}
              dropdownMatchSelectWidth={false}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="resolved">Resolved</Option>
            </Select>
          </Col>
          <Col flex="140px">
            <Select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              size={screens.xs ? "small" : "middle"}
              style={{ width: '100%' }}
              dropdownMatchSelectWidth={false}
            >
              <Option value="all">All Types</Option>
              <Option value="payment_issue">Payment Issues</Option>
              <Option value="booking_issue">Booking Issues</Option>
              <Option value="facility_issue">Facility Issues</Option>
              <Option value="behavior_issue">Behavior Issues</Option>
              <Option value="other">Other</Option>
            </Select>
          </Col>
          <Col flex="120px">
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              size={screens.xs ? "small" : "middle"}
              style={{ width: '100%' }}
              dropdownMatchSelectWidth={false}
            >
              <Option value="all">All Roles</Option>
              <Option value="player">Player</Option>
              <Option value="owner">Owner</Option>
            </Select>
          </Col>
          <Col flex="100px">
            <Button 
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              size={screens.xs ? "small" : "middle"}
              style={{ width: '100%' }}
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
        
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: screens.xs ? '12px' : '14px' }}>Summary:</Text>
          <Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>Pending: <Text strong style={{ color: '#faad14' }}>{pendingCount}</Text></Text>
          <Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>Resolved: <Text strong style={{ color: '#52c41a' }}>{resolvedCount}</Text></Text>
          <Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>Total: <Text strong>{complaints.length}</Text></Text>
          <Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>Filtered: <Text strong>{filteredComplaints.length}</Text></Text>
        </div>
      </Card>

      {/* Complaints Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ padding: screens.xs ? '0 8px' : '0 16px' }}
          size={screens.xs ? "small" : "middle"}
        >
          <TabPane tab="All Complaints" key="all" />
          <TabPane tab={
            <span>
              Pending <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} />
            </span>
          } key="pending" />
          <TabPane tab={
            <span>
              Resolved <Badge count={resolvedCount} style={{ backgroundColor: '#52c41a' }} />
            </span>
          } key="resolved" />

        </Tabs>
        
        <Divider style={{ margin: 0 }} />
        
        <Table 
          dataSource={filteredComplaints} 
          columns={columns} 
          rowKey={(record) => `${record.collectionType}-${record.id}`}
          scroll={{ x: screens.xs ? 800 : 1500 }}
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} complaints`,
            size: screens.xs ? "small" : "default"
          }}
          style={{ 
            border: '1px solid #f0f0f0', 
            borderBottom: 'none',
          }}
          locale={{
            emptyText: searchText || statusFilter !== 'all' || typeFilter !== 'all' || roleFilter !== 'all'
              ? 'No complaints match your filters' 
              : 'No complaints found'
          }}
          size={screens.xs ? "small" : "middle"}
        />
      </Card>

      {/* Complaint Detail Modal */}
      <Modal
        title="Complaint Details"
        open={detailVisible}
        onCancel={closeDetails}
        footer={[
          <Button key="close" onClick={closeDetails}>
            Close
          </Button>,
          selectedComplaint?.status === 'pending' && (
            <>
              <Button
                key="resolve"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={() => {
                  setActionVisible(true);
                  setDetailVisible(false);
                }}
              >
                Take Action
              </Button>
            </>
          )
        ]}
        width={screens.xs ? "100%" : 700}
        style={{ top: screens.xs ? 0 : 20 }}
      >
        {selectedComplaint && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Complaint From">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  icon={selectedComplaint.user.role === 'owner' ? <CrownOutlined /> : <UserOutlined />}
                  style={{
                    marginRight: 8,
                    backgroundColor: selectedComplaint.user.role === 'owner' ? '#4F46E5' : '#52c41a'
                  }}
                />
                <div>
                  <div>{selectedComplaint.user.name}</div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                    <MailOutlined style={{ marginRight: 4 }} />
                    {selectedComplaint.user.email}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                    Role: {selectedComplaint.user.role.toUpperCase()}
                  </div>
                </div>
              </div>
            </Descriptions.Item>
            
            <Descriptions.Item label="Against">
              {selectedComplaint.opponent && selectedComplaint.opponent.name && selectedComplaint.opponent.email ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    icon={selectedComplaint.opponent.role === 'owner' ? <CrownOutlined /> : <UserOutlined />}
                    style={{
                      marginRight: 8,
                      backgroundColor: selectedComplaint.opponent.role === 'owner' ? '#4F46E5' : '#52c41a'
                    }}
                  />
                  <div>
                    <div>{selectedComplaint.opponent.name}</div>
                    <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                      <MailOutlined style={{ marginRight: 4 }} />
                      {selectedComplaint.opponent.email}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '13px' }}>
                      Role: {selectedComplaint.opponent.role.toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                <Text type="secondary">Not specified</Text>
              )}
            </Descriptions.Item>
            
            <Descriptions.Item label="Ground">
              {selectedComplaint.groundName || <Text type="secondary">Not specified</Text>}
            </Descriptions.Item>
            
            <Descriptions.Item label="Type">
              <Tag 
                color={
                  selectedComplaint.type === 'payment_issue' ? 'red' : 
                  selectedComplaint.type === 'booking_issue' ? 'orange' :
                  selectedComplaint.type === 'facility_issue' ? 'blue' : 
                  selectedComplaint.type === 'behavior_issue' ? 'volcano' : 'purple'
                }
              >
                {selectedComplaint.type.replace('_', ' ') || 'Not specified'}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Status">
              <Tag
                color={
                  selectedComplaint.status === 'resolved' ? 'green' : 'orange'
                }
              >
                {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Created At">
              {selectedComplaint.createdAt.toLocaleString()}
            </Descriptions.Item>
            
            {selectedComplaint.resolvedAt && (
              <Descriptions.Item label="Resolved At">
                {selectedComplaint.resolvedAt.toLocaleString()}
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Description">
              <TextArea 
                value={selectedComplaint.description} 
                autoSize 
                readOnly 
                style={{ border: 'none', background: 'transparent', padding: 0 }}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title="Take Action on Complaint"
        open={actionVisible}
        onCancel={handleActionCancel}
      footer={[
          <Button key="cancel" onClick={handleActionCancel}>
            Cancel
          </Button>,
          <Button 
            key="resolve" 
            type="primary" 
            icon={<SafetyCertificateOutlined />}
            onClick={handleActionConfirm}
          >
            Resolve
          </Button>
        ]}
        width={screens.xs ? "100%" : 600}
        style={{ top: screens.xs ? 0 : 20 }}
      >
        {selectedComplaint && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text>You are taking action on a complaint from <strong>{selectedComplaint.user.name}</strong>{selectedComplaint.opponent && selectedComplaint.opponent.name && selectedComplaint.opponent.email ? ` against ${selectedComplaint.opponent.name}` : ''}.</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Complaint Details:</Text>
              <div style={{ 
                padding: 12, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 6, 
                marginTop: 8 
              }}>
                {selectedComplaint.description}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Add Note (Optional):</Text>
              <TextArea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Add any notes about the action taken..."
                rows={4}
                style={{ marginTop: 8 }}
              />
            </div>
            
            <div>
              <Text type="secondary">
                Select "Resolve" to mark this complaint as resolved.
              </Text>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminComplaints;