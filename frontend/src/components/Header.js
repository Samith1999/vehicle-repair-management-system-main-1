import React, { useState } from 'react';
import { 
  Navbar, 
  Container, 
  Button, 
  Dropdown,
  Badge
} from 'react-bootstrap';
import { 
  FaBars, 
  FaBell, 
  FaUser, 
  FaSignOutAlt,
  FaEnvelope,
  FaCog,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Header = ({ user }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = () => {
    switch(user?.role) {
      case 'admin': return 'danger';
      case 'rdhs': return 'success';
      case 'subject_officer': return 'info';
      case 'engineer': return 'warning';
      default: return 'secondary';
    }
  };

  // Notifications data (simulated)
  const notifications = [
    { id: 1, title: 'New repair request', time: '10 mins ago', read: false },
    { id: 2, title: 'Vehicle needs inspection', time: '1 hour ago', read: true },
    { id: 3, title: 'Monthly report ready', time: '2 hours ago', read: true }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Navbar className="navbar-custom" expand="lg">
        <Container fluid>
          {/* Sidebar Toggle */}
          <Button 
            variant="light" 
            className="me-3 d-lg-none"
            onClick={() => document.querySelector('.sidebar').classList.toggle('mobile-open')}
          >
            <FaBars />
          </Button>

          {/* Brand/Logo */}
          <Navbar.Brand 
            href={user ? '/' : '/login'} 
            className="d-flex align-items-center"
          >
            <div className="brand-logo me-2">
              <div className="logo-circle">
                <span>VRS</span>
              </div>
            </div>
            <div>
              <div className="brand-title">Vehicle Repair</div>
              <div className="brand-subtitle">Management System</div>
            </div>
          </Navbar.Brand>

          {/* Right-side Controls */}
          <div className="d-flex align-items-center ms-auto">
            {/* Dark Mode Toggle */}
            <Button 
              variant="light" 
              className="me-2"
              onClick={toggleDarkMode}
              size="sm"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </Button>

            {/* Notifications */}
            <Dropdown align="end" className="me-2">
              <Dropdown.Toggle variant="light" className="position-relative">
                <FaBell />
                {unreadCount > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem' }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="notification-dropdown">
                <Dropdown.Header className="d-flex justify-content-between align-items-center">
                  <span>Notifications</span>
                  <Badge bg="primary" pill>{unreadCount} new</Badge>
                </Dropdown.Header>
                <Dropdown.Divider />
                
                {notifications.map(notification => (
                  <Dropdown.Item 
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  >
                    <div className="d-flex">
                      <div className="notification-icon me-2">
                        <FaBell className={!notification.read ? 'text-primary' : 'text-muted'} />
                      </div>
                      <div>
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-time small text-muted">{notification.time}</div>
                      </div>
                    </div>
                  </Dropdown.Item>
                ))}
                
                <Dropdown.Divider />
                <Dropdown.Item className="text-center">
                  View All Notifications
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* User Menu */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="d-flex align-items-center">
                <div className="user-avatar me-2">
                  <div className="avatar-circle-sm">
                    {getUserInitials()}
                  </div>
                </div>
                <div className="d-none d-md-block">
                  <div className="user-name">{user?.name || 'User'}</div>
                  <div className="user-role small text-muted">{user?.role || 'Role'}</div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="user-dropdown">
                <Dropdown.Header>
                  <div className="text-center">
                    <div className="avatar-circle-lg mx-auto mb-2">
                      {getUserInitials()}
                    </div>
                    <div>{user?.name || 'User'}</div>
                    <div className="small text-muted">{user?.email || 'user@example.com'}</div>
                    <Badge bg={getRoleColor()} className="mt-1">
                      {user?.role?.toUpperCase() || 'USER'}
                    </Badge>
                  </div>
                </Dropdown.Header>
                <Dropdown.Divider />
                
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <FaUser className="me-2" /> My Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  <FaCog className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Item>
                  <FaEnvelope className="me-2" /> Messages
                  <Badge bg="primary" className="ms-2">3</Badge>
                </Dropdown.Item>
                
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Sidebar Overlay */}
      <div 
        className="mobile-sidebar-overlay" 
        onClick={() => document.querySelector('.sidebar').classList.remove('mobile-open')}
      ></div>

      {/* Add CSS styles */}
      <style>
        {`
          .brand-logo .logo-circle {
            width: 40px;
            height: 40px;
            background: linear-gradient(45deg, #1a2980, #26d0ce);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
          }
          
          .brand-title {
            font-weight: 600;
            font-size: 1.1rem;
            line-height: 1;
          }
          
          .brand-subtitle {
            font-size: 0.8rem;
            opacity: 0.8;
            line-height: 1;
          }
          
          .user-avatar .avatar-circle-sm {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
          }
          
          .user-dropdown .avatar-circle-lg {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.5rem;
          }
          
          .notification-dropdown {
            min-width: 300px;
          }
          
          .notification-item {
            padding: 0.75rem 1rem;
          }
          
          .notification-item.unread {
            background-color: #f8f9fa;
          }
          
          .notification-title {
            font-weight: 500;
          }
          
          .notification-time {
            font-size: 0.8rem;
          }
          
          .user-name {
            font-weight: 500;
            line-height: 1;
          }
          
          .user-role {
            line-height: 1;
          }
          
          body.dark-mode {
            background-color: #1a1a1a;
            color: #ffffff;
          }
          
          body.dark-mode .custom-card {
            background-color: #2d2d2d;
            color: #ffffff;
          }
          
          body.dark-mode .custom-table {
            background-color: #2d2d2d;
            color: #ffffff;
          }
          
          body.dark-mode .custom-table thead {
            background-color: #3d3d3d;
          }
          
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0 !important;
            }
            
            .sidebar.mobile-open + .mobile-sidebar-overlay {
              display: block !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Header;