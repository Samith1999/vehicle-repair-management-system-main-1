import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { FaSignInAlt, FaUser, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { authAPI, testConnection } from '../services/api';
import '../App.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [backendStatus, setBackendStatus] = useState('Checking...');
    const navigate = useNavigate();

    // Check backend connection on load
    useEffect(() => {
        checkBackendConnection();
    }, []);

    const checkBackendConnection = async () => {
        const isConnected = await testConnection();
        setBackendStatus(isConnected ? '✅ Connected' : '❌ Not Connected');
        
        if (!isConnected) {
            setError('Backend server is not running. Please start it on port 5000.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('📤 Sending login request...');
        console.log('Email:', email);
        console.log('Password:', password);

        try {
            const response = await authAPI.login(email, password);
            
            console.log('📥 Login response:', response.data);
            
            if (response.data.success) {
                const { user, token } = response.data;
                
                // Store in localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
                
                console.log('✅ Login successful! User:', user);
                
                // Redirect based on role
                setTimeout(() => {
                    switch(user.role) {
                        case 'engineer':
                            navigate('/engineer');
                            break;
                        case 'subject_officer':
                            navigate('/officer');
                            break;
                        case 'rdhs':
                            navigate('/rdhs');
                            break;
                        case 'admin':
                            navigate('/admin');
                            break;
                        default:
                            navigate('/login');
                    }
                }, 500);
                
            } else {
                setError(response.data.error || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Login catch error:', err);
            
            if (err.response) {
                // Server responded with error
                setError(err.response.data?.error || `Server error: ${err.response.status}`);
                console.log('Error response:', err.response.data);
            } else if (err.request) {
                // No response received
                setError('Cannot connect to server. Please check if backend is running on port 5000.');
                console.log('No response:', err.request);
            } else {
                // Other errors
                setError('Login failed: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center min-vh-100">
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white text-center py-3">
                            <h3 className="mb-0">Vehicle Repair System</h3>
                            <small>Login Portal</small>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            <div className="mb-3 text-center">
                                <div className={`alert ${backendStatus.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                                    Backend Status: {backendStatus}
                                </div>
                            </div>
                            
                            {error && (
                                <Alert variant="danger" className="text-center">
                                    {error}
                                </Alert>
                            )}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                    />
                                </Form.Group>
                                
                                <Button 
                                    variant="primary" 
                                    type="submit" 
                                    className="w-100"
                                    disabled={loading || backendStatus.includes('❌')}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </Form>
                        </Card.Body>
                        
                        <Card.Footer className="text-center text-muted small">
                            <div>Backend: http://localhost:5000</div>
                            <div>Frontend: http://localhost:3000</div>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;