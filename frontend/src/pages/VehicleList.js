import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  FormControl,
  Badge,
  Modal,
  Alert,
  Pagination
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaCar,
  FaDownload,
  FaPrint,
  FaSync,
  FaHospital,
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import { vehicleAPI } from '../services/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import '../App.css';

function VehicleList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    registration_number: '',
    vehicle_type: '',
    hospital_name: '',
    current_status: 'operational'
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterAndSortVehicles();
  }, [vehicles, searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAll();
      setVehicles(response.data.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVehicles = () => {
    let filtered = [...vehicles];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.current_status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.vehicle_type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete vehicle');
      }
    }
  };

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
      fetchVehicles();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save vehicle');
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

  const getVehicleTypeOptions = () => {
    const types = [...new Set(vehicles.map(v => v.vehicle_type).filter(Boolean))];
    return types.sort();
  };

  const getStatusStats = () => {
    const stats = {
      operational: 0,
      under_repair: 0,
      repaired: 0,
      approved: 0,
      total: vehicles.length
    };

    vehicles.forEach(vehicle => {
      if (stats[vehicle.current_status] !== undefined) {
        stats[vehicle.current_status]++;
      }
    });

    return stats;
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Registration Number', 'Vehicle Type', 'Hospital Name', 'Current Status', 'Added Date'],
        ...filteredVehicles.map(vehicle => [
          vehicle.registration_number || '',
          vehicle.vehicle_type || '',
          vehicle.hospital_name || '',
          vehicle.current_status || '',
          new Date(vehicle.created_at).toLocaleDateString()
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Vehicles exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exporting vehicles:', error);
      setError('Failed to export vehicles');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = getStatusStats();

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
            <FaExclamationTriangle className="me-2" /> {error}
          </Alert>
        )}

        {/* Header */}
        <Row className="mb-4">
          <Col>
            <Card className="custom-card">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center gap-3">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => navigate('/engineer')}
                      title="Go back to Hospital Officer Dashboard"
                    >
                      ← Back
                    </Button>
                    <div>
                      <h4 className="mb-0">Vehicle Registry</h4>
                      <p className="text-muted mb-0">Manage all vehicles in the system</p>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" onClick={handleExport}>
                    <FaDownload className="me-2" /> Export
                  </Button>
                  <Button variant="outline-secondary" onClick={handlePrint}>
                    <FaPrint className="me-2" /> Print
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-success">
                  <FaCar />
                </div>
                <div className="stats-value">{stats.total}</div>
                <div className="stats-label">Total Vehicles</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-primary">
                  <FaCheckCircle />
                </div>
                <div className="stats-value">{stats.operational}</div>
                <div className="stats-label">Operational</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-warning">
                  <FaTools />
                </div>
                <div className="stats-value">{stats.under_repair}</div>
                <div className="stats-label">Under Repair</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col xl={3} lg={6} md={6} sm={12} className="mb-3">
            <Card className="custom-card h-100">
              <Card.Body className="stats-card">
                <div className="stats-icon text-info">
                  <FaHospital />
                </div>
                <div className="stats-value">{stats.repaired}</div>
                <div className="stats-label">Repaired</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4">
          <Col>
            <Card className="custom-card">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <InputGroup>
                      <FormControl
                        placeholder="Search by registration, type, or hospital..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="custom-form-control"
                      />
                      <Button variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Col>
                  
                  <Col md={3}>
                    <div className="d-flex align-items-center">
                      <FaFilter className="me-2" />
                      <Form.Select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="custom-form-control"
                      >
                        <option value="all">All Status</option>
                        <option value="operational">Operational</option>
                        <option value="under_repair">Under Repair</option>
                        <option value="repaired">Repaired</option>
                        <option value="approved">Approved</option>
                      </Form.Select>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="custom-form-control"
                    >
                      <option value="all">All Types</option>
                      {getVehicleTypeOptions().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  
                  <Col md={2}>
                    <Button 
                      variant="outline-secondary" 
                      onClick={fetchVehicles}
                      className="w-100"
                    >
                      <FaSync className="me-2" /> Refresh
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Vehicle Table */}
        <Row>
          <Col>
            <Card className="custom-card">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Vehicle List</h5>
                  <Badge bg="info">
                    Showing {currentVehicles.length} of {filteredVehicles.length} vehicles
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <LoadingSpinner />
                ) : currentVehicles.length === 0 ? (
                  <div className="text-center py-5">
                    <FaCar size={48} className="text-muted mb-3" />
                    <h4>No vehicles found</h4>
                    <p className="text-muted">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try changing your search criteria' 
                        : 'Add your first vehicle to get started'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table hover className="custom-table">
                        <thead>
                          <tr>
                            <th 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSort('registration_number')}
                            >
                              <div className="d-flex align-items-center">
                                Registration {getSortIcon('registration_number')}
                              </div>
                            </th>
                            <th 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSort('vehicle_type')}
                            >
                              <div className="d-flex align-items-center">
                                Type {getSortIcon('vehicle_type')}
                              </div>
                            </th>
                            <th 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSort('hospital_name')}
                            >
                              <div className="d-flex align-items-center">
                                Hospital {getSortIcon('hospital_name')}
                              </div>
                            </th>
                            <th 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSort('current_status')}
                            >
                              <div className="d-flex align-items-center">
                                Status {getSortIcon('current_status')}
                              </div>
                            </th>
                            <th 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="d-flex align-items-center">
                                Added Date {getSortIcon('created_at')}
                              </div>
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentVehicles.map((vehicle) => (
                            <tr key={vehicle.id}>
                              <td>
                                <strong>{vehicle.registration_number}</strong>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaCar className="me-2 text-muted" />
                                  {vehicle.vehicle_type}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaHospital className="me-2 text-muted" />
                                  {vehicle.hospital_name}
                                </div>
                              </td>
                              <td>
                                <StatusBadge status={vehicle.current_status} type="vehicle" />
                              </td>
                              <td>
                                {new Date(vehicle.created_at).toLocaleDateString()}
                                <div className="small text-muted">
                                  {new Date(vehicle.created_at).toLocaleTimeString()}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditVehicle(vehicle)}
                                    title="Edit Vehicle"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteVehicle(vehicle.id)}
                                    title="Delete Vehicle"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <Pagination>
                          <Pagination.Prev 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                          />
                          
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            
                            // Show first page, last page, and pages around current page
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <Pagination.Item
                                  key={pageNumber}
                                  active={pageNumber === currentPage}
                                  onClick={() => paginate(pageNumber)}
                                >
                                  {pageNumber}
                                </Pagination.Item>
                              );
                            } else if (
                              pageNumber === currentPage - 2 ||
                              pageNumber === currentPage + 2
                            ) {
                              return <Pagination.Ellipsis key={pageNumber} />;
                            }
                            return null;
                          })}
                          
                          <Pagination.Next 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          />
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

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
                <option value="Threewheel">Threewheel</option>
                <option value="Cab">Cab</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Lorry">Lorry</option>
                <option value="Jeep">Jeep</option>
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
                variant="primary"
                type="submit"
                className="btn-custom btn-custom-primary"
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

export default VehicleList;