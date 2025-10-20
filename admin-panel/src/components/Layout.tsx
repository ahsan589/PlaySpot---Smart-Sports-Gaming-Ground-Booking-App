import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  FaUser,
  FaUsers,
  FaFileAlt,
  FaExclamationTriangle,
  FaChartBar,
  FaCheckCircle,
  FaSignOutAlt,
  FaBars,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const menuItems = [
          { key: '/profile', icon: <FaUser />, label: 'Dashboard' },
    { key: '/owner-approvals', icon: <FaCheckCircle />, label: 'Owner Approvals' },
    { key: '/user-management', icon: <FaUsers />, label: 'User Management' },
    { key: '/complaints', icon: <FaExclamationTriangle />, label: 'Complaints' },
    { key: '/monitor-bookings', icon: <FaChartBar />, label: 'Monitor Bookings' },
    { key: '/reports', icon: <FaFileAlt />, label: 'Reports' },

  ];

  const onMenuClick = (key: string) => {
    navigate(key);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <>
      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background-color: #f5f5f5;
          overflow: visible;
        }

        .sidebar {
          width: 250px;
          background-color: #0f172a;
          color: white;
          transition: all 0.3s ease;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
          flex-shrink: 0;
        }

        .sidebar.collapsed {
          width: 60px;
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-header h2 {
          margin: 0;
          font-size: 18px;
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          padding: 5px;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-nav li {
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          border-left: 4px solid transparent;
        }

        .sidebar-nav li:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .sidebar-nav li.active {
          background-color: rgba(255, 255, 255, 0.15);
          border-left-color: #4F46E5;
        }

        .menu-icon {
          font-size: 18px;
          margin-right: 15px;
          min-width: 20px;
          text-align: center;
        }

        .menu-label {
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .menu-label {
          display: none;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding-top: 64px; /* height of the fixed header */
          margin-left: 250px;
          box-sizing: border-box;
        }

        .admin-layout.sidebar-collapsed .main-content {
          margin-left: 60px;
        }

        .admin-header {
          background-color: white;
          padding: 0 20px;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          left: 250px;
          right: 0;
          z-index: 1001;
        }

        .admin-header.collapsed {
          left: 60px;
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .mobile-sidebar-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          margin-right: 15px;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 20px;
          color: #0f172a;
        }

        .user-menu {
          position: relative;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          color: #0f172a;
        }

        .user-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          min-width: 150px;
          z-index: 1000;
        }

        .dropdown-item {
          padding: 12px 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover {
          background-color: #f5f5f5;
        }

        .dropdown-icon {
          margin-right: 10px;
        }

        .content-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 992px) {
          .sidebar {
            position: fixed;
            left: 0;
            height: 100%;
            transform: translateX(-100%);
            z-index: 1000;
          }

          .sidebar.collapsed {
            transform: translateX(0);
            width: 250px;
          }

          .mobile-sidebar-toggle {
            display: block;
          }

          .sidebar-toggle {
            display: none;
          }

          .admin-header {
            padding: 0 15px;
            left: 0;
          }

          .content-area {
            padding: 15px;
          }
        }

        @media (max-width: 576px) {
          .sidebar.collapsed {
            width: 100%;
          }

          .admin-header h1 {
            font-size: 18px;
          }

          .content-area {
            padding: 10px;
          }
        }
      `}</style>

      <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>Admin Panel</h2>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {sidebarCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
            </button>
          </div>
          <nav className="sidebar-nav">
            <ul>
              {menuItems.map(item => (
                <li 
                  key={item.key} 
                  className={location.pathname === item.key ? 'active' : ''}
                  onClick={() => onMenuClick(item.key)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!sidebarCollapsed && <span className="menu-label">{item.label}</span>}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="main-content">
          <header className={`admin-header ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="header-left">
              <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
                <FaBars />
              </button>
              <h1>Dashboard</h1>
            </div>
            
            <div className="user-menu">
              <div className="user-avatar" onClick={toggleUserDropdown}>
                <FaUser />
                {userDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-item" onClick={() => logout()}>
                      <span className="dropdown-icon"><FaSignOutAlt /></span>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          <div className="content-area">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
