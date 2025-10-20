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
  Spin,
  Descriptions
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  IdcardOutlined,
  PhoneOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { User } from '../types';
import type { ColumnsType } from 'antd/es/table';
import { db } from '../../firebaseconfig';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where,
  deleteDoc 
} from 'firebase/firestore';

const { Title, Text } = Typography;
const { Option } = Select;

// Extend the User type to include the new properties
interface ExtendedUser extends User {
  phone?: string;
  cnic?: string;
  joinDate?: Date;
  profileImage?: string;
  photoURL?: string;
  approvalStatus?: string;
  address?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      // Exclude admin users from the list
      const usersQuery = query(usersCollection, where('role', '!=', 'admin'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersList: ExtendedUser[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle different profile picture field names
        const profilePicture = data.profileImage || data.photoURL || data.profilePicture;
        
        return {
          id: doc.id,
          email: data.email,
          role: data.role,
          name: data.name || data.email.split('@')[0],
          profilePicture: profilePicture,
          suspended: data.suspended || false,
          joinDate: data.createdAt?.toDate() || new Date(),
          phone: data.phone || data.phoneNumber || 'Not provided',
          cnic: data.cnic || null,
          approvalStatus: data.approvalStatus || 'pending',
          address: data.address || 'Not provided'
        };
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever search text, role filter, or status filter changes
  useEffect(() => {
    applyFilters();
  }, [searchText, roleFilter, statusFilter, users]);

  // Filter users based on search text, role, and status
  const applyFilters = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchText) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const suspendedStatus = statusFilter === 'suspended';
      result = result.filter(user => user.suspended === suspendedStatus);
    }
    
    setFilteredUsers(result);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  // Suspend user in Firebase
  const suspendUser = async (id: string) => {
    try {
      const userDoc = doc(db, 'users', id);
      await updateDoc(userDoc, {
        suspended: true
      });

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === id ? { ...user, suspended: true } : user
      );
      setUsers(updatedUsers);
      message.success('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      message.error('Failed to suspend user');
    }
  };

  // Unsuspend user in Firebase
  const unsuspendUser = async (id: string) => {
    try {
      const userDoc = doc(db, 'users', id);
      await updateDoc(userDoc, {
        suspended: false
      });

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === id ? { ...user, suspended: false } : user
      );
      setUsers(updatedUsers);
      message.success('User unsuspended successfully');
    } catch (error) {
      console.error('Error unsuspending user:', error);
      message.error('Failed to unsuspend user');
    }
  };

  // Remove user from Firebase
  const removeUser = (id: string) => {
    setSelectedUserId(id);
    setIsRemoveModalVisible(true);
  };

  const handleRemoveConfirm = async () => {
    if (selectedUserId) {
      try {
        // Delete user from Firebase
        await deleteDoc(doc(db, 'users', selectedUserId));
        
        // Update local state
        const updatedUsers = users.filter(user => user.id !== selectedUserId);
        setUsers(updatedUsers);
        message.info('User removed successfully');
      } catch (error) {
        console.error('Error removing user:', error);
        message.error('Failed to remove user');
      } finally {
        setIsRemoveModalVisible(false);
        setSelectedUserId(null);
      }
    }
  };

  const handleRemoveCancel = () => {
    setIsRemoveModalVisible(false);
    setSelectedUserId(null);
  };

  // Show user details
  const showUserDetails = (user: ExtendedUser) => {
    setSelectedUser(user);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedUser(null);
  };

  const columns: ColumnsType<ExtendedUser> = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'user',
      fixed: 'left',
      width: 200,
      render: (name: string, record: ExtendedUser) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            src={record.profilePicture}
            style={{ 
              marginRight: 12, 
              backgroundColor: record.role === 'owner' ? '#4F46E5' : '#52c41a' 
            }} 
          />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ color: '#8c8c8c', fontSize: '13px' }}>ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      render: (email: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MailOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          {email}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag 
          color={role === 'owner' ? 'blue' : 'green'}
          style={{ padding: '5px 10px', borderRadius: 12, textTransform: 'capitalize' }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 150,
      render: (date: Date | undefined) => date ? date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : 'Unknown'
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record: ExtendedUser) => (
        <Tag 
          color={record.suspended ? 'red' : 'green'} 
          icon={record.suspended ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          style={{ padding: '5px 10px', borderRadius: 12 }}
        >
          {record.suspended ? 'Suspended' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 250,
      render: (_, record: ExtendedUser) => (
        <Space>
          <Button 
            icon={<InfoCircleOutlined />}
            onClick={() => showUserDetails(record)}
            style={{ borderRadius: 6 }}
          >
            Details
          </Button>
          {record.suspended ? (
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={() => unsuspendUser(record.id)}
              style={{ borderRadius: 6 }}
            >
              Unsuspend
            </Button>
          ) : (
            <Button 
              icon={<EyeInvisibleOutlined />}
              onClick={() => suspendUser(record.id)}
            >
              Suspend
            </Button>
          )}
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => removeUser(record.id)}
            style={{ borderRadius: 6 }}
          >
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  const suspendedCount = users.filter(user => user.suspended).length;
  const activeCount = users.length - suspendedCount;

  return (
    <div style={{ 
      padding: 24, 
      background: '#f0f2f5',
      minHeight: '100vh',
      overflow: 'visible'
    }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          User Management
          <Badge 
            count={users.length} 
            style={{ 
              marginLeft: 12,
              backgroundColor: '#4F46E5'
            }} 
          />
        </Title>
        <Text type="secondary">
          Manage all system users, their roles and account status
        </Text>
      </div>

      {/* Filters */}
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
            placeholder="Search users by name or email"
            value={searchText}
            onChange={handleSearchChange}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          
          <Select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">All Roles</Option>
            <Option value="player">Players</Option>
            <Option value="owner">Owners</Option>
          </Select>
          
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="suspended">Suspended</Option>
          </Select>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>

          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
          >
            Refresh Data
          </Button>
        </div>
        
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Text strong>Summary:</Text>
          <Text>Active: <Text strong style={{ color: '#52c41a' }}>{activeCount}</Text></Text>
          <Text>Suspended: <Text strong style={{ color: '#f5222d' }}>{suspendedCount}</Text></Text>
          <Text>Total: <Text strong>{users.length}</Text></Text>
          <Text>Filtered: <Text strong>{filteredUsers.length}</Text></Text>
        </div>
      </Card>

      {/* Users Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          <Table 
            dataSource={filteredUsers} 
            columns={columns} 
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
            }}
            style={{ 
              border: '1px solid #f0f0f0', 
              borderBottom: 'none',
            }}
            locale={{
              emptyText: searchText || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'No users match your filters' 
                : 'No users found'
            }}
          />
        </Spin>
      </Card>

      {/* Remove User Confirmation Modal */}
      <Modal
        title="Confirm User Removal"
        open={isRemoveModalVisible}
        onOk={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
        okText="Yes, Remove"
        okType="danger"
        cancelText="Cancel"
      >
        <p>Are you sure you want to remove this user? This action cannot be undone. All user data will be permanently deleted.</p>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        title="User Details"
        open={isDetailModalVisible}
        onCancel={handleDetailModalClose}
        footer={[
          <Button key="close" onClick={handleDetailModalClose}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar 
                size={64} 
                icon={<UserOutlined />} 
                src={selectedUser.profilePicture}
                style={{ 
                  marginRight: 16,
                  backgroundColor: selectedUser.role === 'owner' ? '#4F46E5' : '#52c41a' 
                }} 
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedUser.name}</Title>
                <Text type="secondary">ID: {selectedUser.id}</Text>
              </div>
            </div>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Email">
                <MailOutlined style={{ marginRight: 8 }} />
                {selectedUser.email}
              </Descriptions.Item>
              
              <Descriptions.Item label="Role">
                <Tag 
                  color={selectedUser.role === 'owner' ? 'blue' : 'green'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {selectedUser.role}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Status">
                <Tag 
                  color={selectedUser.suspended ? 'red' : 'green'} 
                  icon={selectedUser.suspended ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                >
                  {selectedUser.suspended ? 'Suspended' : 'Active'}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Phone Number">
                <PhoneOutlined style={{ marginRight: 8 }} />
                {selectedUser.phone || 'Not provided'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Address">
                {selectedUser.address || 'Not provided'}
              </Descriptions.Item>
              
              {selectedUser.role === 'owner' && selectedUser.cnic && (
                <Descriptions.Item label="CNIC">
                  <IdcardOutlined style={{ marginRight: 8 }} />
                  {selectedUser.cnic}
                </Descriptions.Item>
              )}
              
              {selectedUser.role === 'owner' && (
                <Descriptions.Item label="Approval Status">
                  <Tag 
                    color={selectedUser.approvalStatus === 'approved' ? 'green' : 
                           selectedUser.approvalStatus === 'rejected' ? 'red' : 'orange'}
                  >
                    {selectedUser.approvalStatus?.toUpperCase() || 'PENDING'}
                  </Tag>
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label="Join Date">
                {selectedUser.joinDate ? selectedUser.joinDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;