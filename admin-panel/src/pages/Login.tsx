import { Form, Input, Button, Typography, message, Card, Divider, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, TeamOutlined, DashboardOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { type CSSProperties, useState } from 'react';

const { Title, Text } = Typography;

const Login = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    const success = await login(values.email, values.password);
    if (success) {
      message.success('Login successful!');
      navigate('/owner-approvals');
    } else {
      message.error('Invalid credentials or not an admin');
    }
  };

  // Inline styles
  const styles: { [key: string]: CSSProperties } = {
    loginContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #283593 50%, #303f9f 100%)',
      position: 'relative',
      padding: '5%'
    },
    loginBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
    },
    loginBackgroundOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.2)'
    },
    contentWrapper: {
      width: '100%',
      zIndex: 1
    },
    featureCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '5%',
      height: '100%',
      color: 'white'
    },
    featureIcon: {
      fontSize: '32px',
      marginBottom: '16px',
      color: '#ffd54f'
    },
    loginCard: {
      width: '100%',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      zIndex: 1
    },
    loginHeader: {
      textAlign: 'center',
      marginBottom: '10px'
    },
    loginIcon: {
      fontSize: '48px',
      color: '#1890ff',
      marginBottom: '16px'
    },
    loginAlert: {
      marginBottom: '24px',
      borderRadius: '8px'
    },
    loginForm: {
      marginTop: '20px'
    },
    loginFormButton: {
      height: '45px',
      borderRadius: '6px',
      fontWeight: 600,
      background: isHovered 
        ? 'linear-gradient(135deg, #4F46E5 0%, #5d56eaff 100%)' 
        : 'linear-gradient(135deg, #4F46E5 0%, #5d55eaff 100%)',
      border: 'none',
      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      boxShadow: isHovered ? '0 4px 12px #4d46cfff' : 'none',
      transition: 'all 0.3s ease'
    },
    loginFooter: {
      textAlign: 'center',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBackground}>
        <div style={styles.loginBackgroundOverlay}></div>
      </div>
      
      <div style={styles.contentWrapper}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={24} md={12} lg={12}>
            <div style={{ padding: '5%', color: 'white' }}>
              <Title level={1} style={{ color: 'white', marginBottom: '5%', fontSize: 'clamp(24px, 5vw, 36px)' }}>
                Indoor Sports Hub
              </Title>
              <Title level={3} style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: '8%', fontSize: 'clamp(16px, 3vw, 24px)' }}>
                Admin Management Portal
              </Title>
              
              <Row gutter={[16, 16]} style={{ marginBottom: '10%' }}>
                <Col xs={24} sm={8} md={24} lg={8}>
                  <div style={styles.featureCard}>
                    <DashboardOutlined style={styles.featureIcon} />
                    <Title level={4} style={{ color: 'white', fontSize: 'clamp(14px, 2vw, 18px)' }}>Dashboard</Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                      Manage facilities, bookings, and user accounts from a centralized dashboard.
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={8} md={24} lg={8}>
                  <div style={styles.featureCard}>
                    <TeamOutlined style={styles.featureIcon} />
                    <Title level={4} style={{ color: 'white', fontSize: 'clamp(14px, 2vw, 18px)' }}>User Management</Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                      Oversight of all players, facility owners, and staff members in the system.
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={8} md={24} lg={8}>
                  <div style={styles.featureCard}>
                    <SecurityScanOutlined style={styles.featureIcon} />
                    <Title level={4} style={{ color: 'white', fontSize: 'clamp(14px, 2vw, 18px)' }}>Admin Controls</Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                      Advanced controls for system configuration, reporting, and analytics.
                    </Text>
                  </div>
                </Col>
              </Row>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '4%', borderRadius: '8px' }}>
                <Text style={{ color: 'white', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                  <strong>Note:</strong> This portal is restricted to authorized administrators only. 
                  Unauthorized access attempts may be logged and investigated.
                </Text>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={24} md={12} lg={12}>
            <Card style={styles.loginCard}>
              <div style={styles.loginHeader}>
                <div style={styles.loginIcon}>
                  <LoginOutlined />
                </div>
                <Title level={2} style={{ color: '#0f172a', marginBottom: '8px', fontSize: 'clamp(18px, 4vw, 24px)' }}>Admin Portal</Title>
                <Text type="secondary" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>Indoor Sports Management System</Text>
              </div>
              
              <Divider />
              <Form
                name="login"
                onFinish={onFinish}
                layout="vertical"
                style={styles.loginForm}
                size="large"
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#888', marginRight: '8px' }} />}
                    placeholder="admin@example.com"
                    style={{ borderRadius: '6px', padding: '8px 11px' }}
                  />
                </Form.Item>
                
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#888', marginRight: '8px' }} />}
                    placeholder="Password"
                    style={{ borderRadius: '6px', padding: '8px 11px' }}
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    style={styles.loginFormButton} 
                    block
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>
              <Divider />
              
              <div style={styles.loginFooter}>
                <Text type="secondary" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                  © {new Date().getFullYear()} Indoor Sports Hub. All rights reserved.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Login;
