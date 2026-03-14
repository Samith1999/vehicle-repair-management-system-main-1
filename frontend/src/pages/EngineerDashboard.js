import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ProgressBar
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaSearch, 
  FaCar, 
  FaTools, 
  FaClock, 
  FaCheckCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaFilter,
  FaPrint,
  FaDownload,
  FaPen,
  FaPaperPlane,
  FaTrash
} from 'react-icons/fa';
import { vehicleAPI, repairAPI } from '../services/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AutocompleteInput from '../components/AutocompleteInput';
import '../App.css';

function EngineerDashboard() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPrintSection, setSelectedPrintSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRepairHistoryMode, setIsRepairHistoryMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: '', 
    vehicle_type: '',
    hospital_name: '',
    inspection_date: new Date().toISOString().split('T')[0],
    repair_details: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'engineer') {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterRepairs();
  }, [searchTerm, statusFilter, repairRequests]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, repairsRes] = await Promise.all([
        vehicleAPI.getAll(),
        repairAPI.getEngineerRepairs(user ? user.id : 1)
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setRepairRequests(repairsRes.data.data);
      setFilteredRepairs(repairsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterRepairs = () => {
    let filtered = repairRequests;

    if (searchTerm) {
      filtered = filtered.filter(repair =>
        repair.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.repair_details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(repair => repair.status === statusFilter);
    }

    setFilteredRepairs(filtered);
  };

  const resetForm = () => {
    setFormData({
      registration_number: '',
      vehicle_type: '',
      hospital_name: '',
      inspection_date: new Date().toISOString().split('T')[0],
      repair_details: ''
    });
    setError('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startSignature = (e) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawSignature = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endSignature = () => {
    if (!canvasRef.current) return;
    setIsDrawing(false);
    const signatureImage = canvasRef.current.toDataURL();
    setFormData({ ...formData, engineer_signature: signatureImage });
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setFormData({ ...formData, engineer_signature: '' });
  };

  const handleSubmit = async (e) => {
    // Handle both form submission and direct button click
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setError('');
    
    if (!formData.registration_number.trim()) {
      setError('Please enter vehicle registration number');
      return;
    }

    if (!formData.vehicle_type.trim()) {
      setError('Please enter vehicle type');
      return;
    }

    if (!formData.hospital_name.trim()) {
      setError('Please enter hospital name');
      return;
    }

    if (!formData.repair_details.trim()) {
      setError('Please enter repair details');
      return;
    }

    try {
      await repairAPI.create({
        registration_number: formData.registration_number,
        vehicle_type: formData.vehicle_type,
        hospital_name: formData.hospital_name,
        inspection_date: formData.inspection_date,
        engineer_id: user.id,
        engineer_name: user.name,
        repair_details: formData.repair_details,
        status: 'sent_to_officer'
      });

      setSuccess('Inspection report submitted and sent to Subject Officer successfully!');
      setShowForm(false);
      resetForm();
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit inspection report');
    }
  };

  const handleSendToRDHS = async () => {
    if (!selectedReport) return;

    try {
      await repairAPI.updateStatus(selectedReport.id, {
        status: 'sent_to_officer',
        officer_id: user.id
      });

      setSuccess(`Inspection report for ${selectedReport.registration_number} sent to RDHS Officer successfully!`);
      setShowSendModal(false);
      setSelectedReport(null);
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send report to RDHS');
    }
  };

  const handleExportCSV = () => {
    if (filteredRepairs.length === 0) {
      setError('No inspection reports to export');
      return;
    }

    try {
      // Prepare CSV headers
      const headers = ['ID', 'Registration Number', 'Vehicle Type', 'Hospital', 'Inspection Date', 'Status', 'Repair Details'];
      
      // Prepare CSV rows
      const rows = filteredRepairs.map(repair => [
        repair.id || '',
        repair.registration_number || '',
        repair.vehicle_type || '',
        repair.hospital_name || '',
        repair.inspection_date || '',
        repair.status || '',
        repair.repair_details || ''
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `inspection_reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Reports exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export reports');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this inspection report? This action cannot be undone.')) {
      try {
        await repairAPI.delete(requestId);
        setSuccess('Inspection report deleted successfully!');
        fetchDashboardData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete report');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handlePrintClick = (report) => {
    setSelectedReport(report);
    setSelectedPrintSection('');
    setShowPrintModal(true);
  };

  const handlePrintSection = () => {
    if (!selectedPrintSection) {
      setError('Please select a section to print');
      return;
    }

    // Hide all sections except the selected one
    const allSections = document.querySelectorAll('[data-print-section]');
    allSections.forEach(section => {
      if (section.getAttribute('data-print-section') !== selectedPrintSection) {
        section.style.display = 'none';
      }
    });

    // Print
    window.print();

    // Show all sections again
    allSections.forEach(section => {
      section.style.display = '';
    });

    // Close modal
    setShowPrintModal(false);
    setSelectedReport(null);
    setSelectedPrintSection('');
  };

  const handleDownloadReport = (report) => {
    if (!report) return;

    try {
      // Create a formatted text content for the report
      const reportContent = `VEHICLE INSPECTION REPORT
========================================

Vehicle Information:
- Registration Number: ${report.registration_number}
- Vehicle Type: ${report.vehicle_type}
- Hospital Name: ${report.hospital_name}
- Inspection Date: ${report.inspection_date ? new Date(report.inspection_date).toLocaleDateString() : '-'}

Inspection Details:
- Repair Details: ${report.repair_details}

Status: ${report.status}
Hospital Officer: ${report.engineer_name}

========================================`;

      // Create blob and download as text file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `inspection_report_${report.registration_number}_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Report downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download report');
    }
  };

  const getStats = () => {
    const total = repairRequests.length;
    const sentToOfficer = repairRequests.filter(r => r.status === 'sent_to_officer').length;
    const rejectedByDirector = repairRequests.filter(r => r.status === 'rejected').length;
    const approved = repairRequests.filter(r => r.status === 'approved').length;

    return { total, sentToOfficer, rejectedByDirector, approved };
  };

  const stats = getStats();

  if (loading && !user) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header user={user} />
      <Container fluid className="dashboard-container">
        {success && (
          <Alert variant="success" className="alert-dismissible fade show" dismissible onClose={() => setSuccess('')}>
            <FaCheckCircle className="me-2" /> {success}
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="alert-dismissible fade show" dismissible onClose={() => setError('')}>
            <FaExclamationCircle className="me-2" /> {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <div data-print-section="stats">
          <Row className="mb-4">
            <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
              <Card className="custom-card h-100">
                <Card.Body className="stats-card">
                  <div className="stats-icon text-primary">
                    <FaCar />
                  </div>
                  <div className="stats-value">{stats.total}</div>
                  <div className="stats-label">Total Inspections</div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
              <Card className="custom-card h-100">
                <Card.Body className="stats-card">
                  <div className="stats-icon text-warning">
                    <FaClock />
                  </div>
                  <div className="stats-value">{stats.sentToOfficer}</div>
                  <div className="stats-label">Sent to Officer</div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
              <Card className="custom-card h-100">
                <Card.Body className="stats-card">
                  <div className="stats-icon text-success">
                    <FaCheckCircle />
                  </div>
                  <div className="stats-value">{stats.approved}</div>
                  <div className="stats-label">Director Approved</div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
              <Card className="custom-card h-100">
                <Card.Body className="stats-card">
                  <div className="stats-icon text-danger">
                    <FaExclamationCircle />
                  </div>
                  <div className="stats-value">{stats.rejectedByDirector}</div>
                  <div className="stats-label">Director Rejected</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Action Bar */}
        <Row className="mb-4">
          <Col>
            <Card className="custom-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Vehicle Inspection Management</h5>
                  <Button 
                    variant="primary" 
                    className="btn-custom btn-custom-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <FaPlus className="me-2" /> New Inspection Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Row className="mb-4">
          <Col>
            <Card className="custom-card">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <InputGroup>
                      <FormControl
                        placeholder="Search by vehicle number, type, or repair details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="custom-form-control"
                      />
                      <Button variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center">
                      <FaFilter className="me-2" />
                      <Form.Select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="custom-form-control"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Inspection</option>
                        <option value="inspection_completed">Report Completed</option>
                        <option value="sent_to_officer">Sent to RDHS Officer</option>
                        <option value="approved">Approved</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Repair History Mode Indicator */}
        {isRepairHistoryMode && (
          <Row className="mb-4">
            <Col>
              <Alert variant="info" className="d-flex justify-content-between align-items-center mb-0">
                <div>
                  <FaTools className="me-2" /> Viewing Repair History (Approved Repairs)
                </div>
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setIsRepairHistoryMode(false);
                  }}
                >
                  <FaFileAlt className="me-2" /> Back to All Reports
                </Button>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Repair Requests Table */}
        <div data-print-section="repairs">
          <Row>
            <Col>
              <Card className="custom-card">
                <Card.Header>
                  <h5 className="mb-0">Vehicle Inspection Reports</h5>
                </Card.Header>
                <Card.Body>
                {loading ? (
                  <LoadingSpinner />
                ) : filteredRepairs.length === 0 ? (
                  <div className="text-center py-5">
                    <FaFileAlt size={48} className="text-muted mb-3" />
                    <h4>No inspection reports found</h4>
                    <p className="text-muted">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try changing your search criteria' 
                        : 'Start by creating your first inspection report'}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="custom-table">
                      <thead>
                        <tr>
                          <th>Vehicle Registration</th>
                          <th>Vehicle Type</th>
                          <th>Hospital Name</th>
                          <th>Inspection Date</th>
                          <th>Repair Details</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRepairs.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <strong>{request.registration_number}</strong>
                            </td>
                            <td>
                              {request.vehicle_type}
                            </td>
                            <td>
                              {request.hospital_name}
                            </td>
                            <td>
                              {request.inspection_date ? new Date(request.inspection_date).toLocaleDateString() : '-'}
                              <div className="small text-muted">
                                {request.created_at && new Date(request.created_at).toLocaleTimeString()}
                              </div>
                            </td>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '300px' }} title={request.repair_details}>
                                {request.repair_details}
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={request.status} />
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  title="Delete Report"
                                >
                                  <FaTrash /> Delete
                                </Button>
                                
                                {request.status === 'inspection_completed' && (
                                  <Button 
                                    variant="success" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReport(request);
                                      setShowSendModal(true);
                                    }}
                                    title="Send to RDHS Officer"
                                  >
                                    <FaPaperPlane />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="outline-success" 
                                  size="sm"
                                  onClick={() => handleDownloadReport(request)}
                                  title="Download Report"
                                >
                                  <FaDownload />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                
                {filteredRepairs.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">
                      Showing {filteredRepairs.length} of {repairRequests.length} inspections
                    </div>
                    <div>
                      <Button variant="light" size="sm" className="me-2" onClick={handleExportCSV}>
                        <FaDownload className="me-1" /> Export
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        </div>

        {/* Vehicles Under Repair */}
        <Row className="mt-4">
          <Col md={6}>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Vehicles Currently Under Repair</h5>
              </Card.Header>
              <Card.Body>
                <ul className="list-group list-group-flush">
                  {vehicles
                    .filter(v => v.current_status === 'under_repair')
                    .slice(0, 5)
                    .map(vehicle => (
                      <li key={vehicle.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{vehicle.registration_number}</strong>
                          <div className="small text-muted">{vehicle.vehicle_type}</div>
                        </div>
                        <Badge bg="warning">Under Repair</Badge>
                      </li>
                    ))}
                  
                  {vehicles.filter(v => v.current_status === 'under_repair').length === 0 && (
                    <li className="list-group-item text-center text-muted py-3">
                      No vehicles under repair
                    </li>
                  )}
                </ul>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    className="text-start"
                    onClick={() => navigate('/vehicles')}
                  >
                    <FaFileAlt className="me-2" /> View All Vehicles
                  </Button>
                  <Button 
                    variant="outline-success" 
                    className="text-start"
                    onClick={() => navigate('/reports')}
                  >
                    <FaDownload className="me-2" /> Download Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Inspection Report Modal */}
      <Modal 
        show={showForm} 
        onHide={() => {
          setShowForm(false);
          resetForm();
        }}
        size="lg"
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPen className="me-2" /> Vehicle Inspection Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {/* Vehicle Information Section */}
            <h6 className="mb-3 fw-bold text-primary">Vehicle Information</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Registration Number *</Form.Label>
              <Form.Control
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({
                  ...formData,
                  registration_number: e.target.value.toUpperCase()
                })}
                placeholder="e.g., WP 1234 AB"
                className="custom-form-control"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vehicle Type *</Form.Label>
              <Form.Select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({
                  ...formData,
                  vehicle_type: e.target.value
                })}
                className="custom-form-control"
                required
              >
                <option value="">Select vehicle type</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Van">Van</option>
                <option value="Threewheel">Threewheel</option>
                <option value="Cab">Cab</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Lorry">Lorry</option>
                <option value="Jeep">Jeep</option>
              </Form.Select>
            </Form.Group>

            <AutocompleteInput
              label="Hospital / MOH Office Name"
              value={formData.hospital_name}
              onChange={(e) => setFormData({
                ...formData,
                hospital_name: e.target.value
              })}
              onSelect={(value) => setFormData({
                ...formData,
                hospital_name: value
              })}
              fetchSuggestions={vehicleAPI.getHospitalSuggestions}
              placeholder="Enter hospital or MOH office name"
              debounceDelay={300}
              minChars={1}
              required={true}
            />

            <Form.Group className="mb-3">
              <Form.Label>Inspection Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({
                  ...formData,
                  inspection_date: e.target.value
                })}
                className="custom-form-control"
                required
              />
            </Form.Group>

            <hr />

            {/* Inspection Details Section */}
            <h6 className="mb-3 fw-bold text-primary">Inspection Details</h6>

            <Form.Group className="mb-3">
              <Form.Label>Repair Details / Complaints *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.repair_details}
                onChange={(e) => setFormData({
                  ...formData,
                  repair_details: e.target.value
                })}
                placeholder="Describe the vehicle issues and repair needed..."
                className="custom-form-control"
                required
              />
            </Form.Group>



            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-custom"
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary" 
            disabled={!formData.registration_number.trim() || !formData.vehicle_type.trim() || !formData.hospital_name.trim() || !formData.repair_details.trim()}
            className="btn-custom btn-custom-primary"
            onClick={handleSubmit}
          >
            <FaPlus className="me-2" /> Submit Report
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send to RDHS Modal */}
      <Modal
        show={showSendModal}
        onHide={() => {
          setShowSendModal(false);
          setSelectedReport(null);
        }}
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Report to RDHS Officer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <>
              <Alert variant="info">
                <div className="d-flex align-items-center">
                  <FaCar className="me-2" />
                  <div>
                    <strong>{selectedReport.registration_number}</strong>
                    <div className="small">{selectedReport.vehicle_type} • {selectedReport.hospital_name}</div>
                  </div>
                </div>
              </Alert>
              
              <div className="mb-3">
                <strong>Repair Details:</strong>
                <p className="mt-1 small">{selectedReport.repair_details}</p>
              </div>
              
              <div className="alert alert-warning">
                <FaExclamationCircle className="me-2" />
                This report will be sent to the RDHS (Vehicle Subject Officer) for review and approval.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSendModal(false);
              setSelectedReport(null);
            }}
            className="btn-custom"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSendToRDHS}
            className="btn-custom btn-custom-success"
          >
            <FaPaperPlane className="me-2" /> Send to RDHS Officer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Print Section Selection Modal */}
      <Modal
        show={showPrintModal}
        onHide={() => {
          setShowPrintModal(false);
          setSelectedReport(null);
          setSelectedPrintSection('');
        }}
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Section to Print</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <>
              <p className="mb-3">Choose which section of the report you want to print:</p>
              <div className="d-grid gap-2">
                <Form.Check
                  type="radio"
                  label="Dashboard Stats"
                  name="printSection"
                  value="stats"
                  checked={selectedPrintSection === 'stats'}
                  onChange={(e) => setSelectedPrintSection(e.target.value)}
                  id="print-stats"
                />
                <Form.Check
                  type="radio"
                  label="Inspection Details"
                  name="printSection"
                  value="details"
                  checked={selectedPrintSection === 'details'}
                  onChange={(e) => setSelectedPrintSection(e.target.value)}
                  id="print-details"
                />
                <Form.Check
                  type="radio"
                  label="Inspection Findings"
                  name="printSection"
                  value="findings"
                  checked={selectedPrintSection === 'findings'}
                  onChange={(e) => setSelectedPrintSection(e.target.value)}
                  id="print-findings"
                />
                <Form.Check
                  type="radio"
                  label="Repair Details"
                  name="printSection"
                  value="repairs"
                  checked={selectedPrintSection === 'repairs'}
                  onChange={(e) => setSelectedPrintSection(e.target.value)}
                  id="print-repairs"
                />
                <Form.Check
                  type="radio"
                  label="All Sections"
                  name="printSection"
                  value="all"
                  checked={selectedPrintSection === 'all'}
                  onChange={(e) => setSelectedPrintSection(e.target.value)}
                  id="print-all"
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPrintModal(false);
              setSelectedReport(null);
              setSelectedPrintSection('');
            }}
            className="btn-custom"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePrintSection}
            className="btn-custom"
          >
            <FaPrint className="me-2" /> Print
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default EngineerDashboard;