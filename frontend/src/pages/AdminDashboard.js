import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
  InputGroup,
  FormControl,
  Tabs,
  Tab,
  Dropdown,
  ProgressBar,
  ListGroup,
  ListGroupItem,
  Accordion
} from 'react-bootstrap';
import {
  FaUsers,
  FaCar,
  FaTools,
  FaChartBar,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaHistory,
  FaCog,
  FaDatabase,
  FaShieldAlt,
  FaBell,
  FaEnvelope,
  FaKey,
  FaUserCog,
  FaHospital,
  FaAmbulance,
  FaFileExport,
  FaSync,
  FaUserCheck,
  FaUserTimes,
  FaCheck,
  FaChartPie,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEllipsisV,
  FaDownload
} from 'react-icons/fa';
import { authAPI, vehicleAPI, repairAPI } from '../services/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import '../App.css';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Users state
  const [officers, setOfficers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'engineer'
  });
  const [userSearchFilter, setUserSearchFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  
  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    registration_number: '',
    vehicle_type: '',
    hospital_name: '',
    current_status: 'operational'
  });
  const [vehicleSearchFilter, setVehicleSearchFilter] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');
  
  // System stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    engineerCount: 0,
    officerCount: 0,
    rdhsCount: 0,
    totalVehicles: 0,
    operationalVehicles: 0,
    underRepairVehicles: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    approvedRepairs: 0,
    rejectedRepairs: 0,
    completedRepairs: 0
  });
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    databaseStatus: 'Online',
    apiStatus: 'Running',
    lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000),
    activeUsers: 3
  });
  
  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    // In real app, check if user is admin
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, vehiclesRes, repairsRes] = await Promise.all([
        authAPI.getOfficers(),
        vehicleAPI.getAll(),
        repairAPI.getAll()
      ]);
      
      const usersList = usersRes.data.data;
      const vehiclesList = vehiclesRes.data.data;
      const repairs = repairsRes.data.data;
      
      setOfficers(usersList);
      setVehicles(vehiclesList);
      
      // Calculate user roles breakdown
      const engineerCount = usersList.filter(u => u.role === 'engineer').length;
      const officerCount = usersList.filter(u => u.role === 'subject_officer').length;
      const rdhsCount = usersList.filter(u => u.role === 'rdhs').length;
      
      // Calculate vehicle status breakdown
      const operationalVehicles = vehiclesList.filter(v => v.current_status === 'operational').length;
      const underRepairVehicles = vehiclesList.filter(v => v.current_status === 'under_repair').length;
      
      // Calculate repair status breakdown
      const pendingRepairs = repairs.filter(r => r.status === 'pending' || r.status === 'inspection_completed').length;
      const approvedRepairs = repairs.filter(r => r.status === 'approved').length;
      const rejectedRepairs = repairs.filter(r => r.status === 'rejected').length;
      const completedRepairs = repairs.filter(r => r.status === 'approved').length;
      
      // Generate activity logs (mock data for now)
      const logs = [
        { id: 1, action: 'User login', actor: 'Admin', timestamp: new Date(Date.now() - 5 * 60000), type: 'login' },
        { id: 2, action: 'Vehicle added', actor: 'Admin', timestamp: new Date(Date.now() - 15 * 60000), type: 'add' },
        { id: 3, action: 'Repair approved', actor: 'Officer', timestamp: new Date(Date.now() - 30 * 60000), type: 'update' },
        { id: 4, action: 'User created', actor: 'Admin', timestamp: new Date(Date.now() - 60 * 60000), type: 'create' },
        { id: 5, action: 'System backup', actor: 'System', timestamp: new Date(Date.now() - 120 * 60000), type: 'backup' }
      ];
      setActivityLogs(logs);
      
      setStats({
        totalUsers: usersList.length,
        engineerCount,
        officerCount,
        rdhsCount,
        totalVehicles: vehiclesList.length,
        operationalVehicles,
        underRepairVehicles,
        totalRepairs: repairs.length,
        pendingRepairs,
        approvedRepairs,
        rejectedRepairs,
        completedRepairs
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (selectedUser) {
        await authAPI.updateUser(selectedUser.id, userFormData);
        setSuccess(`User ${userFormData.name} updated successfully!`);
      } else {
        await authAPI.createUser(userFormData);
        setSuccess(`User ${userFormData.name} created successfully!`);
      }
      
      setShowUserModal(false);
      resetUserForm();
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await authAPI.deleteUser(userId);
        setSuccess('User deleted successfully!');
        fetchDashboardData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete user');
      }
    }
  };

  const resetUserForm = () => {
    setSelectedUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'engineer'
    });
  };

  // Vehicle Management Functions
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (selectedVehicle) {
        await vehicleAPI.update(selectedVehicle.id, vehicleFormData);
        setSuccess('Vehicle updated successfully!');
      } else {
        await vehicleAPI.create(vehicleFormData);
        setSuccess('Vehicle added successfully!');
      }
      
      setShowVehicleModal(false);
      resetVehicleForm();
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      hospital_name: vehicle.hospital_name,
      current_status: vehicle.current_status
    });
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await vehicleAPI.delete(vehicleId);
        setSuccess('Vehicle deleted successfully!');
        fetchDashboardData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete vehicle');
      }
    }
  };

  const resetVehicleForm = () => {
    setSelectedVehicle(null);
    setVehicleFormData({
      registration_number: '',
      vehicle_type: '',
      hospital_name: '',
      current_status: 'operational'
    });
  };

  // System functions
  const exportData = async () => {
    // In real app, implement data export
    alert('Export functionality would be implemented here');
  };

  const backupDatabase = async () => {
    // In real app, implement backup
    alert('Database backup functionality would be implemented here');
  };

  const sendSystemNotification = () => {
    // In real app, implement notifications
    alert('System notification functionality would be implemented here');
  };

  const getRoleBadge = (role) => {
    const colors = {
      engineer: 'warning',
      subject_officer: 'info',
      rdhs: 'success',
      admin: 'danger'
    };
    
    const roleDisplay = {
      engineer: 'Hospital Officer',
      subject_officer: 'Subject Officer',
      rdhs: 'RDHS',
      admin: 'Administrator'
    };
    
    return (
      <Badge bg={colors[role] || 'secondary'}>
        {roleDisplay[role] || role.toUpperCase()}
      </Badge>
    );
  };

  // Filter Users
  const filteredUsers = officers.filter(officer => {
    const matchesSearch = officer.name.toLowerCase().includes(userSearchFilter.toLowerCase()) ||
                         officer.email.toLowerCase().includes(userSearchFilter.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || officer.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter Vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.registration_number.toLowerCase().includes(vehicleSearchFilter.toLowerCase()) ||
                         vehicle.hospital_name.toLowerCase().includes(vehicleSearchFilter.toLowerCase());
    const matchesStatus = vehicleStatusFilter === 'all' || vehicle.current_status === vehicleStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get repair status color
  const getRepairStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      inspection_completed: 'info',
      sent_to_officer: 'info',
      sent_to_rdhs_director: 'info',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'secondary';
  };

  // Format timestamp
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header user={user} />
      <Container fluid className="dashboard-container">
        {success && (
          <Alert variant="success" className="alert-dismissible fade show" dismissible onClose={() => setSuccess('')}>
            <FaCheck className="me-2" /> {success}
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="alert-dismissible fade show" dismissible onClose={() => setError('')}>
            <FaUserTimes className="me-2" /> {error}
          </Alert>
        )}

        {/* Main Stats Cards */}
        <Row className="mb-4">
          {/* User Stats */}
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100 border-left-primary shadow">
              <Card.Body className="stats-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-label" style={{ fontSize: '12px', color: '#6c757d' }}>Total Users</div>
                    <div className="stats-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>{stats.totalUsers}</div>
                  </div>
                  <div className="stats-icon text-primary" style={{ fontSize: '40px', opacity: 0.2 }}>
                    <FaUsers />
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '12px' }}>
                  <span className="me-2">👨‍💼 {stats.engineerCount} Officers</span>
                  <span>👮 {stats.officerCount} Officer+</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Vehicle Stats */}
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100 border-left-success shadow">
              <Card.Body className="stats-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-label" style={{ fontSize: '12px', color: '#6c757d' }}>Total Vehicles</div>
                    <div className="stats-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.totalVehicles}</div>
                  </div>
                  <div className="stats-icon text-success" style={{ fontSize: '40px', opacity: 0.2 }}>
                    <FaCar />
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '12px' }}>
                  <span className="me-2">✅ {stats.operationalVehicles} Operational</span>
                  <span>🔧 {stats.underRepairVehicles} Under Repair</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Repair Stats */}
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100 border-left-warning shadow">
              <Card.Body className="stats-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-label" style={{ fontSize: '12px', color: '#6c757d' }}>Total Repairs</div>
                    <div className="stats-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.totalRepairs}</div>
                  </div>
                  <div className="stats-icon text-warning" style={{ fontSize: '40px', opacity: 0.2 }}>
                    <FaTools />
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '12px' }}>
                  <span className="me-2">⏳ {stats.pendingRepairs} Pending</span>
                  <span>✅ {stats.approvedRepairs} Approved</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Performance Stats */}
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100 border-left-danger shadow">
              <Card.Body className="stats-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-label" style={{ fontSize: '12px', color: '#6c757d' }}>Rejection Rate</div>
                    <div className="stats-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
                      {stats.totalRepairs > 0 ? ((stats.rejectedRepairs / stats.totalRepairs) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="stats-icon text-danger" style={{ fontSize: '40px', opacity: 0.2 }}>
                    <FaChartBar />
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '12px' }}>
                  <span className="me-2">❌ {stats.rejectedRepairs} Rejected</span>
                  <span>🎯 Completion Rate</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content with Tabs */}
        <Card className="custom-card mb-4">
          <Card.Body>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="overview" title={
                <span>
                  <FaChartBar className="me-1" />
                  Overview
                </span>
              }>
                <Row className="mt-3">
                  <Col lg={6} md={12} className="mb-3">
                    <Card className="custom-card">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0"><FaInfoCircle className="me-2" />System Status</h5>
                      </Card.Header>
                      <Card.Body>
                        <ListGroup variant="flush">
                          <ListGroupItem className="d-flex justify-content-between align-items-center border-0 pb-2">
                            <span>Database Status</span>
                            <Badge bg="success"><FaCheckCircle className="me-1" />Online</Badge>
                          </ListGroupItem>
                          <ListGroupItem className="d-flex justify-content-between align-items-center border-0 pb-2">
                            <span>API Status</span>
                            <Badge bg="success"><FaCheckCircle className="me-1" />Running</Badge>
                          </ListGroupItem>
                          <ListGroupItem className="d-flex justify-content-between align-items-center border-0 pb-2">
                            <span>Last Backup</span>
                            <span className="text-muted" style={{ fontSize: '13px' }}>
                              <FaClock className="me-1" />{formatTime(systemHealth.lastBackup)}
                            </span>
                          </ListGroupItem>
                          <ListGroupItem className="d-flex justify-content-between align-items-center border-0">
                            <span>Active Users</span>
                            <Badge bg="info">{systemHealth.activeUsers}</Badge>
                          </ListGroupItem>
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col lg={6} md={12} className="mb-3">
                    <Card className="custom-card">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0"><FaUsers className="me-2" />User Distribution</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row className="text-center">
                          <Col md={3} sm={6} className="mb-3">
                            <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{stats.engineerCount}</div>
                              <div style={{ fontSize: '12px', color: '#856404' }}>Hospital Officers</div>
                            </div>
                          </Col>
                          <Col md={3} sm={6} className="mb-3">
                            <div style={{ padding: '15px', background: '#cfe2ff', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#084298' }}>{stats.officerCount}</div>
                              <div style={{ fontSize: '12px', color: '#084298' }}>Subject Officers</div>
                            </div>
                          </Col>
                          <Col md={3} sm={6} className="mb-3">
                            <div style={{ padding: '15px', background: '#d1e7dd', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f5132' }}>{stats.rdhsCount}</div>
                              <div style={{ fontSize: '12px', color: '#0f5132' }}>RDHS Directors</div>
                            </div>
                          </Col>
                          <Col md={3} sm={6} className="mb-3">
                            <div style={{ padding: '15px', background: '#e2ced4', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#842029' }}>1</div>
                              <div style={{ fontSize: '12px', color: '#842029' }}>Admins</div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={12} className="mb-3">
                    <Card className="custom-card">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0"><FaHistory className="me-2" />Recent Activity</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="activity-log">
                          {activityLogs.slice(0, 5).map((log) => (
                            <div key={log.id} className="d-flex align-items-start mb-3 pb-3 border-bottom" style={{ borderBottom: '1px solid #ddd' }}>
                              <div 
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  borderRadius: '50%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  marginRight: '12px',
                                  fontSize: '18px',
                                  backgroundColor: log.type === 'login' ? '#cfe2ff' : 
                                                 log.type === 'add' ? '#d1e7dd' :
                                                 log.type === 'update' ? '#fff3cd' : '#e2ced4'
                                }}
                              >
                                {log.type === 'login' ? '🔐' : 
                                 log.type === 'add' ? '➕' :
                                 log.type === 'update' ? '✏️' : '💾'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', marginBottom: '2px' }}>{log.action}</div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  by <strong>{log.actor}</strong> • {formatTime(log.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={12} className="mb-3">
                    <Card className="custom-card">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0"><FaTools className="me-2" />Repair Status Summary</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6} className="mb-3">
                            <div className="mb-2 d-flex justify-content-between">
                              <span>Pending Repairs</span>
                              <Badge bg="warning">{stats.pendingRepairs}</Badge>
                            </div>
                            <ProgressBar 
                              now={stats.totalRepairs > 0 ? (stats.pendingRepairs / stats.totalRepairs * 100) : 0} 
                              variant="warning" 
                              style={{ height: '10px' }}
                            />
                          </Col>
                          <Col md={6} className="mb-3">
                            <div className="mb-2 d-flex justify-content-between">
                              <span>Approved Repairs</span>
                              <Badge bg="success">{stats.approvedRepairs}</Badge>
                            </div>
                            <ProgressBar 
                              now={stats.totalRepairs > 0 ? (stats.approvedRepairs / stats.totalRepairs * 100) : 0} 
                              variant="success"
                              style={{ height: '10px' }}
                            />
                          </Col>
                          <Col md={6}>
                            <div className="mb-2 d-flex justify-content-between">
                              <span>Rejected Repairs</span>
                              <Badge bg="danger">{stats.rejectedRepairs}</Badge>
                            </div>
                            <ProgressBar 
                              now={stats.totalRepairs > 0 ? (stats.rejectedRepairs / stats.totalRepairs * 100) : 0} 
                              variant="danger"
                              style={{ height: '10px' }}
                            />
                          </Col>
                          <Col md={6}>
                            <div className="mb-2 d-flex justify-content-between">
                              <span>Completion Rate</span>
                              <Badge bg="info">
                                {stats.totalRepairs > 0 ? ((stats.completedRepairs / stats.totalRepairs) * 100).toFixed(1) : 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={stats.totalRepairs > 0 ? (stats.completedRepairs / stats.totalRepairs * 100) : 0} 
                              variant="info"
                              style={{ height: '10px' }}
                            />
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={12} className="mb-3">
                    <Card className="custom-card">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0"><FaCog className="me-2" />Quick Actions</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={3} sm={6} className="mb-2">
                            <Button 
                              variant="outline-primary" 
                              className="w-100 d-flex align-items-center justify-content-center"
                              onClick={() => setActiveTab('users')}
                            >
                              <FaUserPlus className="me-2" /> Add User
                            </Button>
                          </Col>
                          <Col md={3} sm={6} className="mb-2">
                            <Button 
                              variant="outline-info" 
                              className="w-100 d-flex align-items-center justify-content-center"
                              onClick={exportData}
                            >
                              <FaDownload className="me-2" /> Export Data
                            </Button>
                          </Col>
                          <Col md={3} sm={6} className="mb-2">
                            <Button 
                              variant="outline-warning" 
                              className="w-100 d-flex align-items-center justify-content-center"
                              onClick={backupDatabase}
                            >
                              <FaDatabase className="me-2" /> Backup
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="users" title={
                <span>
                  <FaUsers className="me-1" />
                  User Management
                  <Badge bg="primary" className="ms-2">{stats.totalUsers}</Badge>
                </span>
              }>
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                    <h5 className="mb-0 flex-grow-1">System Users</h5>
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        resetUserForm();
                        setShowUserModal(true);
                      }}
                      size="sm"
                    >
                      <FaUserPlus className="me-2" /> Add New User
                    </Button>
                  </div>

                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={8} className="mb-2">
                      <InputGroup className="mb-2">
                        <InputGroup.Text className="bg-light">
                          <FaSearch />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search by name or email..."
                          value={userSearchFilter}
                          onChange={(e) => setUserSearchFilter(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={4} className="mb-2">
                      <Form.Select 
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="engineer">Hospital Officer</option>
                        <option value="subject_officer">Subject Officer</option>
                        <option value="rdhs">RDHS</option>
                        <option value="admin">Administrator</option>
                      </Form.Select>
                    </Col>
                  </Row>
                
                  <Table hover responsive className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((officer) => (
                          <tr key={officer.id}>
                            <td>#{officer.id}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                     style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>
                                  {officer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <span>{officer.name}</span>
                              </div>
                            </td>
                            <td>{officer.email}</td>
                            <td>{getRoleBadge(officer.role)}</td>
                            <td>
                              {new Date(officer.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditUser(officer)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteUser(officer.id)}
                                  disabled={officer.id === user?.id}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">
                            No users found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  <div className="text-muted small mt-2">
                    Showing {filteredUsers.length} of {officers.length} users
                  </div>
                </div>
              </Tab>
              
              
              <Tab eventKey="settings" title={
                <span>
                  <FaCog className="me-1" />
                  System Settings
                </span>
              }>
                <div className="mt-3">
                  <Row>
                    <Col lg={6} md={12} className="mb-3">
                      <Card className="custom-card">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0"><FaEnvelope className="me-2" />System Configuration</h5>
                        </Card.Header>
                        <Card.Body>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>System Name</Form.Label>
                              <Form.Control
                                type="text"
                                defaultValue="Vehicle Repair Management System"
                                className="custom-form-control"
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>System Email</Form.Label>
                              <Form.Control
                                type="email"
                                defaultValue="admin@vehiclerepair.com"
                                className="custom-form-control"
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Email Notifications</Form.Label>
                              <Form.Check
                                type="switch"
                                id="email-notifications"
                                label="Enable email notifications for system events"
                                defaultChecked
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Auto Backup Frequency</Form.Label>
                              <Form.Select className="custom-form-control" defaultValue="Daily">
                                <option>Every 6 hours</option>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                              </Form.Select>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Max Upload Size (MB)</Form.Label>
                              <Form.Control
                                type="number"
                                defaultValue="50"
                                className="custom-form-control"
                              />
                            </Form.Group>
                            
                            <Button variant="primary" className="w-100">
                              <FaSync className="me-2" /> Save Configuration
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col lg={6} md={12} className="mb-3">
                      <Card className="custom-card">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0"><FaShieldAlt className="me-2" />Security Settings</h5>
                        </Card.Header>
                        <Card.Body>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Password Policy</Form.Label>
                              <Form.Select className="custom-form-control" defaultValue="Minimum 12 characters">
                                <option>Minimum 8 characters</option>
                                <option>Minimum 12 characters</option>
                                <option>Complex passwords required (uppercase, numbers, symbols)</option>
                              </Form.Select>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Session Timeout (minutes)</Form.Label>
                              <Form.Select className="custom-form-control" defaultValue="1 hour">
                                <option>15 minutes</option>
                                <option>30 minutes</option>
                                <option>1 hour</option>
                                <option>2 hours</option>
                              </Form.Select>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Two-Factor Authentication</Form.Label>
                              <Form.Check
                                type="switch"
                                id="2fa"
                                label="Require 2FA for admin accounts"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Account Lockout</Form.Label>
                              <Form.Check
                                type="switch"
                                id="lockout"
                                label="Lock account after 5 failed login attempts"
                                defaultChecked
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Audit Logging</Form.Label>
                              <Form.Check
                                type="switch"
                                id="audit-log"
                                label="Enable detailed audit logging"
                                defaultChecked
                              />
                            </Form.Group>
                            
                            <Button variant="danger" className="w-100">
                              <FaShieldAlt className="me-2" /> Update Security Settings
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={12} className="mb-3">
                      <Card className="custom-card">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0"><FaExclamationTriangle className="me-2" />System Maintenance</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6} className="mb-3">
                              <div className="p-3 bg-light rounded">
                                <h6 className="mb-2">Database Optimization</h6>
                                <p className="text-muted small mb-3">Optimize database for better performance and reduce storage usage.</p>
                                <Button variant="warning" size="sm" className="w-100">
                                  <FaSync className="me-2" /> Run Optimization
                                </Button>
                              </div>
                            </Col>
                            <Col md={6} className="mb-3">
                              <div className="p-3 bg-light rounded">
                                <h6 className="mb-2">Clear Cache</h6>
                                <p className="text-muted small mb-3">Clear application cache and temporary files.</p>
                                <Button variant="info" size="sm" className="w-100">
                                  <FaSync className="me-2" /> Clear Cache
                                </Button>
                              </div>
                            </Col>
                            <Col md={6} className="mb-3">
                              <div className="p-3 bg-light rounded">
                                <h6 className="mb-2">Export Logs</h6>
                                <p className="text-muted small mb-3">Download system logs for analysis and archival.</p>
                                <Button variant="success" size="sm" className="w-100">
                                  <FaDownload className="me-2" /> Export Logs
                                </Button>
                              </div>
                            </Col>
                            <Col md={6} className="mb-3">
                              <div className="p-3 bg-light rounded">
                                <h6 className="mb-2">System Health Check</h6>
                                <p className="text-muted small mb-3">Run comprehensive system diagnostics.</p>
                                <Button variant="primary" size="sm" className="w-100">
                                  <FaCheckCircle className="me-2" /> Run Check
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* User Modal */}
      <Modal
        show={showUserModal}
        onHide={() => {
          setShowUserModal(false);
          resetUserForm();
        }}
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUserSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({
                  ...userFormData,
                  name: e.target.value
                })}
                placeholder="Enter full name"
                className="custom-form-control"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({
                  ...userFormData,
                  email: e.target.value
                })}
                placeholder="Enter email address"
                className="custom-form-control"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                {selectedUser ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Form.Label>
              <Form.Control
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({
                  ...userFormData,
                  password: e.target.value
                })}
                placeholder="Enter password"
                className="custom-form-control"
                required={!selectedUser}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                value={userFormData.role}
                onChange={(e) => setUserFormData({
                  ...userFormData,
                  role: e.target.value
                })}
                className="custom-form-control"
                required
              >
                <option value="engineer">Hospital Officer</option>
                <option value="subject_officer">Subject Officer</option>
                <option value="rdhs">RDHS</option>
                <option value="admin">Administrator</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUserModal(false);
                  resetUserForm();
                }}
                className="btn-custom"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="btn-custom btn-custom-primary"
              >
                {selectedUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Vehicle Modal */}
      <Modal
        show={showVehicleModal}
        onHide={() => {
          setShowVehicleModal(false);
          resetVehicleForm();
        }}
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleVehicleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Registration Number *</Form.Label>
              <Form.Control
                type="text"
                value={vehicleFormData.registration_number}
                onChange={(e) => setVehicleFormData({
                  ...vehicleFormData,
                  registration_number: e.target.value.toUpperCase()
                })}
                placeholder="Enter registration number"
                className="custom-form-control"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Type *</Form.Label>
              <Form.Select
                value={vehicleFormData.vehicle_type}
                onChange={(e) => setVehicleFormData({
                  ...vehicleFormData,
                  vehicle_type: e.target.value
                })}
                className="custom-form-control"
                required
              >
                <option value="">Select vehicle type</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Van">Van</option>
                <option value="Car">Car</option>
                <option value="Bus">Bus</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Truck">Truck</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Hospital Name *</Form.Label>
              <Form.Control
                type="text"
                value={vehicleFormData.hospital_name}
                onChange={(e) => setVehicleFormData({
                  ...vehicleFormData,
                  hospital_name: e.target.value
                })}
                placeholder="Enter hospital name"
                className="custom-form-control"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Current Status *</Form.Label>
              <Form.Select
                value={vehicleFormData.current_status}
                onChange={(e) => setVehicleFormData({
                  ...vehicleFormData,
                  current_status: e.target.value
                })}
                className="custom-form-control"
                required
              >
                <option value="operational">Operational</option>
                <option value="under_repair">Under Repair</option>
                <option value="repaired">Repaired</option>
                <option value="approved">Approved</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowVehicleModal(false);
                  resetVehicleForm();
                }}
                className="btn-custom"
              >
                Cancel
              </Button>
              <Button
                variant="success"
                type="submit"
                className="btn-custom btn-custom-success"
              >
                {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default AdminDashboard;