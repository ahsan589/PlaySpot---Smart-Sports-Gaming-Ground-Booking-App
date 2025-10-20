import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import OwnerApprovals from './pages/OwnerApprovals';
import UserManagement from './pages/UserManagement';
import Complaints from './pages/Complaints';
import MonitorBookings from './pages/MonitorBookings';
import Reports from './pages/Reports';
import { useUser } from './context/UserContext';

const App: React.FC = () => {
  const { user } = useUser();

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="profile" element={<Profile />} />
          <Route path="owner-approvals" element={<OwnerApprovals />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="monitor-bookings" element={<MonitorBookings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
