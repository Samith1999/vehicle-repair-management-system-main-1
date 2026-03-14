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
  Dropdown,
  ProgressBar,
  Tabs,
  Tab
} from 'react-bootstrap';
import {
  FaForward,
  FaSearch,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaFilter,
  FaClock,
  FaPaperPlane,
  FaHistory,
  FaChartLine,
  FaExclamationTriangle,
  FaUserCheck,
  FaTrash,
  FaClipboard,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { repairAPI, vehicleAPI } from '../services/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function OfficerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [repairRequests, setRepairRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [forwardComments, setForwardComments] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('sent_to_officer');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    forwarded: 0,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'subject_officer') {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, repairRequests]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await repairAPI.getAll();
      const requests = response.data.data;
      
      setRepairRequests(requests);
      // Default filter to show incoming reports from engineers
      setFilteredRequests(requests.filter(req => req.status === 'sent_to_officer'));
      
      // Calculate stats
      const incomingCount = requests.filter(req => req.status === 'sent_to_officer').length;
      const forwardedCount = requests.filter(req => req.status === 'sent_to_rdhs_director').length;
      
      setStats({
        pending: incomingCount,
        forwarded: forwardedCount,
        total: requests.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = repairRequests;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.engineer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleReviewClick = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleForwardClick = (request) => {
    setSelectedRequest(request);
    setShowForwardModal(true);
  };

  const handleForwardToRDHSDirector = async () => {
    if (!selectedRequest) return;

    try {
      await repairAPI.updateStatus(selectedRequest.id, {
        status: 'sent_to_rdhs_director',
        officer_id: user.id,
        officer_comments: forwardComments
      });

      setSuccess(`Report for ${selectedRequest.registration_number} forwarded to RDHS Director successfully!`);
      setShowForwardModal(false);
      setShowReviewModal(false);
      setSelectedRequest(null);
      setForwardComments('');
      
      // Refresh data
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to forward report');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this inspection report? This action cannot be undone.')) {
      try {
        await repairAPI.delete(requestId);
        setSuccess('Report deleted successfully!');
        fetchDashboardData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete report');
      }
    }
  };

  const getStatusStats = () => {
    const statusCounts = {
      sent_to_officer: 0,
      sent_to_rdhs_director: 0,
      approved: 0,
      rejected: 0
    };

    repairRequests.forEach(request => {
      if (statusCounts[request.status] !== undefined) {
        statusCounts[request.status]++;
      }
    });

    return statusCounts;
  };

  const statusStats = getStatusStats();

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
            <FaTimesCircle className="me-2" /> {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-primary">
                  <FaClipboard />
                </div>
                <div className="stats-value">{stats.total}</div>
                <div className="stats-label">Total Reports</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-warning">
                  <FaClock />
                </div>
                <div className="stats-value">{stats.pending}</div>
                <div className="stats-label">Pending Review</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-info">
                  <FaPaperPlane />
                </div>
                <div className="stats-value">{stats.forwarded}</div>
                <div className="stats-label">Forwarded to Director</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-success">
                  <FaCheckCircle />
                </div>
                <div className="stats-value">{statusStats.approved}</div>
                <div className="stats-label">Director Approved</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Dashboard Refresh Button */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={fetchDashboardData}
                className="me-2"
              >
                <FaChartLine className="me-2" /> Refresh Dashboard
              </Button>
            </div>
          </Col>
        </Row>

        {/* Status Distribution */}
        <Row className="mb-4">
          <Col>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Status Distribution</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(statusStats).map(([status, count]) => (
                    <Col key={status} md={3} className="mb-3">
                      <div className="d-flex align-items-center">
                        <StatusBadge status={status} />
                        <span className="ms-2 fw-bold">{count}</span>
                      </div>
                      <ProgressBar 
                        now={repairRequests.length > 0 ? (count / repairRequests.length) * 100 : 0}
                        className="mt-1"
                        variant={status === 'pending' ? 'warning' : 
                                status === 'sent_to_rdhs' ? 'info' :
                                status === 'approved' ? 'success' : 'danger'}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Dashboard Controls */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
              >
                ← Back
              </Button>
            </div>
          </Col>
        </Row>

        {/* Repair Requests Table */}
        <Row>
          <Col>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Hospital Officer Inspection Reports</h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <LoadingSpinner />
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-5">
                    <FaCheckCircle size={48} className="text-muted mb-3" />
                    <h4>No inspection reports found</h4>
                    <p className="text-muted">
                      {statusFilter === 'sent_to_officer'
                        ? 'No pending reports for review!' 
                        : 'No reports match your filters'}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="custom-table">
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Vehicle Details</th>
                          <th>Hospital</th>
                          <th>Inspection Findings</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <strong>#{request.id}</strong>
                            </td>
                            <td>
                              <div>
                                <strong>{request.registration_number}</strong>
                                <div className="text-muted small">
                                  {request.vehicle_type}
                                </div>
                              </div>
                            </td>
                            <td>{request.hospital_name}</td>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '250px' }} title={request.inspection_findings}>
                                {request.inspection_findings || request.repair_details}
                              </div>
                            </td>
                            <td>
                              {request.created_at && new Date(request.created_at).toLocaleDateString()}
                              <div className="small text-muted">
                                {request.created_at && new Date(request.created_at).toLocaleTimeString()}
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={request.status} />
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleReviewClick(request)}
                                  title="Review Report"
                                >
                                  <FaEye />
                                </Button>
                                
                                {request.status === 'sent_to_officer' && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowForwardModal(true);
                                    }}
                                    title="Forward to RDHS Director"
                                  >
                                    <FaPaperPlane />
                                  </Button>
                                )}
                                
                                {request.status === 'sent_to_officer' && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteRequest(request.id)}
                                    title="Delete Report"
                                  >
                                    <FaTrash />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => window.print()}
                                  title="Print Report"
                                >
                                  <FaHistory />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                
                {filteredRequests.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">
                      Showing {filteredRequests.length} of {repairRequests.length} total reports
                    </div>
                    <div className="small text-muted">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions and Recent Activity */}
        <Row className="mt-4">
          <Col lg={8}>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Recently Forwarded to Director</h5>
              </Card.Header>
              <Card.Body>
                <ul className="list-group list-group-flush">
                  {repairRequests
                    .filter(req => req.status === 'sent_to_rdhs_director')
                    .slice(0, 5)
                    .map(request => (
                      <li key={request.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>#{request.id}</strong> - {request.registration_number}
                          <div className="small text-muted">
                            Forwarded on {request.created_at && new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </li>
                    ))}
                  
                  {repairRequests.filter(req => req.status === 'sent_to_rdhs_director').length === 0 && (
                    <li className="list-group-item text-center text-muted py-3">
                      <FaPaperPlane className="me-2" />
                      No reports forwarded yet
                    </li>
                  )}
                </ul>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="custom-card">
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    className="text-start d-flex align-items-center"
                    onClick={() => setStatusFilter('sent_to_officer')}
                  >
                    <FaClock className="me-2" /> Pending Reviews
                  </Button>
                  <Button 
                    variant="info" 
                    className="text-start d-flex align-items-center"
                    onClick={() => setStatusFilter('sent_to_rdhs_director')}
                  >
                    <FaPaperPlane className="me-2" /> Forwarded to Director
                  </Button>
                  <Button 
                    variant="success" 
                    className="text-start d-flex align-items-center"
                    onClick={() => navigate('/reports')}
                  >
                    <FaChartLine className="me-2" /> View Reports
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="text-start d-flex align-items-center"
                    onClick={() => setStatusFilter('all')}
                  >
                    <FaFilter className="me-2" /> All Status
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Review Inspection Report Modal */}
      <Modal
        show={showReviewModal}
        onHide={() => {
          setShowReviewModal(false);
          setSelectedRequest(null);
        }}
        size="lg"
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Review Hospital Officer Inspection Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <Alert variant="info">
                <div className="d-flex align-items-center">
                  <FaCar className="me-2" />
                  <div>
                    <strong>{selectedRequest.registration_number}</strong>
                    <div className="small">{selectedRequest.vehicle_type} • {selectedRequest.hospital_name}</div>
                  </div>
                </div>
              </Alert>
              
              <div className="mb-3">
                <strong>Inspection Date:</strong>
                <p className="mt-1">{selectedRequest.inspection_date ? new Date(selectedRequest.inspection_date).toLocaleDateString() : '-'}</p>
              </div>
              
              <div className="mb-3">
                <strong>Repair Details:</strong>
                <p className="mt-1">{selectedRequest.repair_details}</p>
              </div>
              
              <div className="mb-3">
                <strong>Inspection Findings:</strong>
                <p className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.inspection_findings}</p>
              </div>
              
              {selectedRequest.recommended_repairs && (
                <div className="mb-3">
                  <strong>Recommended Repairs:</strong>
                  <p className="mt-1">{selectedRequest.recommended_repairs}</p>
                </div>
              )}
              
              <div className="alert alert-warning">
                <FaExclamationTriangle className="me-2" />
                Review the inspection findings and proceed to forward this report to the RDHS Director for approval.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowReviewModal(false);
              setSelectedRequest(null);
            }}
            className="btn-custom"
          >
            Close
          </Button>
          <Button
            variant="success"
            onClick={() => {
              setShowReviewModal(false);
              setShowForwardModal(true);
            }}
            className="btn-custom btn-custom-success"
          >
            <FaPaperPlane className="me-2" /> Forward to Director
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Forward to RDHS Director Modal */}
      <Modal
        show={showForwardModal}
        onHide={() => {
          setShowForwardModal(false);
          setSelectedRequest(null);
          setForwardComments('');
        }}
        centered
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Forward to RDHS Director</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <Alert variant="info">
                <div className="d-flex align-items-center">
                  <FaCar className="me-2" />
                  <div>
                    <strong>{selectedRequest.registration_number}</strong>
                    <div className="small">
                      {selectedRequest.vehicle_type} • {selectedRequest.hospital_name}
                    </div>
                  </div>
                </div>
              </Alert>
              
              <div className="mb-3">
                <strong>Hospital Officer Inspection Findings:</strong>
                <p className="mt-1 small">{selectedRequest.inspection_findings}</p>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Officer Comments (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={forwardComments}
                  onChange={(e) => setForwardComments(e.target.value)}
                  placeholder="Add any additional comments or observations for the RDHS Director..."
                  className="custom-form-control"
                />
                <Form.Text className="text-muted">
                  Your comments will be visible to the RDHS Director for decision-making
                </Form.Text>
              </Form.Group>
              
              <div className="alert alert-warning">
                <FaExclamationTriangle className="me-2" />
                This inspection report will be forwarded to the RDHS Director for review and approval. The Director will either approve or reject the repair request.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowForwardModal(false);
              setSelectedRequest(null);
              setForwardComments('');
            }}
            className="btn-custom"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleForwardToRDHSDirector}
            className="btn-custom btn-custom-success"
          >
            <FaPaperPlane className="me-2" /> Confirm Forward to Director
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default OfficerDashboard;