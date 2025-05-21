import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchVendorPayments, 
  fetchVendorPaymentSummary,
  fetchVendorPaymentDetails,
  createVendorPayment, 
  updatePaymentStatus,
  clearSuccess,
  clearError
} from '../../store/super-admin/vendor-payments-slice/vendorPaymentsSlice';
import { 
  Container, 
  Card, 
  Row, 
  Col, 
  Table, 
  Badge, 
  Button, 
  Form, 
  Modal, 
  Alert, 
  Pagination,
  Spinner,
  Tabs,
  Tab
} from 'react-bootstrap';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaPlus, FaSearch, FaFilter, FaFileInvoiceDollar } from 'react-icons/fa';
import SuperAdminLayout from './superAdminLayout';

const VendorPayments = () => {
  const dispatch = useDispatch();
  const { 
    vendorPayments, 
    pagination, 
    paymentDetails, 
    summary, 
    isLoading, 
    error, 
    success, 
    message 
  } = useSelector(state => state.superAdminVendorPayments);
  
  // Component state
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    vendorId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [newPayment, setNewPayment] = useState({
    vendorId: '',
    amount: '',
    description: '',
    paymentMethod: 'manual'
  });

  // Status colors
  const statusColors = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary'
  };

  // Initial data load
  useEffect(() => {
    dispatch(fetchVendorPayments({ page: currentPage }));
    dispatch(fetchVendorPaymentSummary());
  }, [dispatch, currentPage]);

  // Update when success status changes
  useEffect(() => {
    if (success) {
      // Reload data after successful action
      dispatch(fetchVendorPayments({ page: currentPage }));
      dispatch(fetchVendorPaymentSummary());
      
      // Clear modals
      setShowPaymentModal(false);
      setShowDetailsModal(false);
      
      // Reset form
      setNewPayment({
        vendorId: '',
        amount: '',
        description: '',
        paymentMethod: 'manual'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
    }
  }, [success, dispatch, currentPage]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle applying filters
  const handleFilterApply = () => {
    dispatch(fetchVendorPayments({ 
      page: 1, 
      ...filters 
    }));
    setCurrentPage(1);
  };

  // Handle input change for filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      vendorId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    dispatch(fetchVendorPayments({ page: 1 }));
    setCurrentPage(1);
  };

  // Handle view payment details
  const handleViewDetails = (paymentId) => {
    setSelectedPaymentId(paymentId);
    dispatch(fetchVendorPaymentDetails(paymentId));
    setShowDetailsModal(true);
  };

  // Handle new payment input change
  const handleNewPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle payment creation
  const handleCreatePayment = (e) => {
    e.preventDefault();
    dispatch(createVendorPayment(newPayment));
  };

  // Handle payment status update
  const handleUpdateStatus = (paymentId, newStatus) => {
    dispatch(updatePaymentStatus({ paymentId, status: newStatus }));
  };

  // Pagination component
  const PaginationComponent = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const items = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === pagination.currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev 
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        />
        {items}
        <Pagination.Next 
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        />
      </Pagination>
    );
  };

  // Render payment summary cards
  const renderSummaryCards = () => (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center h-100 shadow-sm">
          <Card.Body>
            <h2 className="text-primary">{formatCurrency(summary.totalPaid)}</h2>
            <Card.Title>Total Payments Made</Card.Title>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 shadow-sm">
          <Card.Body>
            <h2 className="text-warning">{formatCurrency(summary.totalPending)}</h2>
            <Card.Title>Pending Payments</Card.Title>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 shadow-sm">
          <Card.Body>
            <h2 className="text-success">{formatCurrency(summary.totalPlatformFee)}</h2>
            <Card.Title>Platform Revenue</Card.Title>
            <small className="text-muted">5% commission fee</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 shadow-sm">
          <Card.Body>
            <Button 
              variant="primary" 
              className="w-100"
              onClick={() => setShowPaymentModal(true)}
            >
              <FaPlus className="me-2" />
              New Payment
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // Render payment history table
  const renderPaymentsTable = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-light">
        <Row className="align-items-center">
          <Col>
            <h5 className="m-0">Vendor Payments</h5>
          </Col>
          <Col md="auto">
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="me-2"
              onClick={() => dispatch(fetchVendorPayments({ page: 1 }))}
            >
              <FaSearch className="me-1" /> Refresh
            </Button>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        {/* Filters section */}
        <div className="mb-4 p-3 border rounded">
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Vendor ID</Form.Label>
                <Form.Control 
                  type="text" 
                  name="vendorId" 
                  value={filters.vendorId}
                  onChange={handleFilterChange}
                  placeholder="Enter vendor ID"
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  name="status" 
                  value={filters.status}
                  onChange={handleFilterChange}
                  size="sm"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="startDate" 
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="endDate" 
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md="auto">
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleFilterApply}
              >
                <FaFilter className="me-1" /> Apply
              </Button>
            </Col>
            <Col md="auto">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </div>

        {/* Payments table */}
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : vendorPayments.length === 0 ? (
          <Alert variant="info">No payments found.</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorPayments.map(payment => (
                  <tr key={payment._id}>
                    <td>{payment._id.substring(0, 8)}...</td>
                    <td>
                      {payment.vendorId ? (
                        <>
                          <div>{payment.vendorId.name || 'N/A'}</div>
                          <small className="text-muted">{payment.vendorId.shopName || 'N/A'}</small>
                        </>
                      ) : 'Unknown Vendor'}
                    </td>
                    <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <Badge bg={statusColors[payment.status] || 'secondary'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td>{payment.paymentMethod}</td>
                    <td>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewDetails(payment._id)}
                      >
                        Details
                      </Button>
                      {payment.status === 'pending' && (
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          className="me-1"
                          onClick={() => handleUpdateStatus(payment._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        <PaginationComponent />
      </Card.Body>
    </Card>
  );

  // Render vendor payments by vendor chart
  const renderPaymentsByVendor = () => (
    <Card className="shadow-sm mt-4">
      <Card.Header className="bg-light">
        <h5 className="m-0">Top Vendor Payments</h5>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : summary.paymentsByVendor?.length === 0 ? (
          <Alert variant="info">No payment data available.</Alert>
        ) : (
          <Table className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>Vendor</th>
                <th>Shop</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {summary.paymentsByVendor?.map((vendor, index) => (
                <tr key={index}>
                  <td>{vendor.vendorName || 'N/A'}</td>
                  <td>{vendor.shopName || 'N/A'}</td>
                  <td className="fw-bold">{formatCurrency(vendor.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  // Render recent payments
  const renderRecentPayments = () => (
    <Card className="shadow-sm mt-4">
      <Card.Header className="bg-light">
        <h5 className="m-0">Recent Payments</h5>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : summary.recentPayments?.length === 0 ? (
          <Alert variant="info">No recent payments.</Alert>
        ) : (
          <div className="table-responsive">
            <Table className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentPayments?.map(payment => (
                  <tr key={payment._id}>
                    <td>
                      {payment.vendorId ? (
                        <>
                          <div>{payment.vendorId.name || 'N/A'}</div>
                          <small className="text-muted">{payment.vendorId.shopName || 'N/A'}</small>
                        </>
                      ) : 'Unknown Vendor'}
                    </td>
                    <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <Badge bg={statusColors[payment.status] || 'secondary'}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  // Create new payment modal
  const renderNewPaymentModal = () => (
    <Modal 
      show={showPaymentModal} 
      onHide={() => setShowPaymentModal(false)}
      backdrop="static"
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFileInvoiceDollar className="me-2" />
          Create New Vendor Payment
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCreatePayment}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Vendor ID*</Form.Label>
            <Form.Control 
              type="text" 
              name="vendorId" 
              value={newPayment.vendorId}
              onChange={handleNewPaymentChange}
              placeholder="Enter vendor ID"
              required
            />
            <Form.Text className="text-muted">
              Enter the MongoDB ID of the vendor.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Amount (GHS)*</Form.Label>
            <Form.Control 
              type="number" 
              name="amount" 
              value={newPayment.amount}
              onChange={handleNewPaymentChange}
              placeholder="Enter payment amount"
              step="0.01"
              min="0"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={2}
              name="description" 
              value={newPayment.description}
              onChange={handleNewPaymentChange}
              placeholder="Enter payment description"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Payment Method</Form.Label>
            <Form.Select 
              name="paymentMethod" 
              value={newPayment.paymentMethod}
              onChange={handleNewPaymentChange}
            >
              <option value="manual">Manual</option>
              <option value="bank">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={isLoading || !newPayment.vendorId || !newPayment.amount}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              'Create Payment'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  // Payment details modal
  const renderPaymentDetailsModal = () => (
    <Modal 
      show={showDetailsModal} 
      onHide={() => setShowDetailsModal(false)}
      backdrop="static"
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Payment Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : !paymentDetails ? (
          <Alert variant="danger">Failed to load payment details.</Alert>
        ) : (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <h6>Payment ID</h6>
                <p className="text-muted">{paymentDetails._id}</p>
              </Col>
              <Col md={6}>
                <h6>Status</h6>
                <Badge bg={statusColors[paymentDetails.status] || 'secondary'} className="fs-6">
                  {paymentDetails.status}
                </Badge>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <h6>Amount</h6>
                <h3 className="text-primary">{formatCurrency(paymentDetails.amount)}</h3>
              </Col>
              <Col md={6}>
                <h6>Date</h6>
                <p>{formatDate(paymentDetails.createdAt)}</p>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <h6>Vendor Name</h6>
                <p>{paymentDetails.vendorId?.name || 'N/A'}</p>
              </Col>
              <Col md={6}>
                <h6>Shop Name</h6>
                <p>{paymentDetails.vendorId?.shopName || 'N/A'}</p>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <h6>Payment Method</h6>
                <p>{paymentDetails.paymentMethod}</p>
              </Col>
              <Col md={6}>
                <h6>Transaction Type</h6>
                <p>{paymentDetails.transactionType}</p>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={12}>
                <h6>Description</h6>
                <p>{paymentDetails.description || 'No description provided.'}</p>
              </Col>
            </Row>
            
            {/* Show related order details if available */}
            {paymentDetails.orderId && (
              <div className="border-top pt-3 mt-3">
                <h5>Related Order</h5>
                <Row className="mb-2">
                  <Col md={6}>
                    <h6>Order ID</h6>
                    <p className="text-muted">{paymentDetails.orderId._id}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Order Amount</h6>
                    <p>{formatCurrency(paymentDetails.orderId.totalAmount)}</p>
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {paymentDetails && paymentDetails.status === 'pending' && (
          <>
            <Button 
              variant="success" 
              onClick={() => handleUpdateStatus(paymentDetails._id, 'completed')}
            >
              Mark as Completed
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleUpdateStatus(paymentDetails._id, 'cancelled')}
            >
              Cancel Payment
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <SuperAdminLayout>
      <Container fluid className="py-4">
        <h2 className="mb-4">Vendor Payments</h2>
        
        {error && (
          <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => dispatch(clearSuccess())}>
            {message}
          </Alert>
        )}
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="payments" title="Payments">
            {renderSummaryCards()}
            {renderPaymentsTable()}
          </Tab>
          <Tab eventKey="analytics" title="Analytics">
            {renderSummaryCards()}
            {renderPaymentsByVendor()}
            {renderRecentPayments()}
          </Tab>
        </Tabs>
        
        {/* Modals */}
        {renderNewPaymentModal()}
        {renderPaymentDetailsModal()}
      </Container>
    </SuperAdminLayout>
  );
};

export default VendorPayments;
