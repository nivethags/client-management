/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { engagementAPI, workOrderAPI, billingAPI, paymentAPI } from '../utils/api';
import PaymentStatusTracker from '../components/PaymentStatusTracker';

const EngagementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isClient, isProvider } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engagement, setEngagement] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [billingStatements, setBillingStatements] = useState([]);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingAmount, setBillingAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showPaymentTracker, setShowPaymentTracker] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // eslint-disable-next-line no-unused-vars

  const fetchEngagementDetails = async () => {
    try {
      setLoading(true);
      const [engagementRes, workOrdersRes, billingRes] = await Promise.all([
        engagementAPI.getById(id),
        workOrderAPI.getByEngagement(id),
        engagementAPI.getBillingStatements(id),
      ]);

      if (engagementRes.data.success) {
        setEngagement(engagementRes.data.data);
      } else {
        throw new Error(engagementRes.data.message || 'Failed to fetch engagement');
      }

      if (workOrdersRes.data.success) {
        setWorkOrders(workOrdersRes.data.data || []);
      }

      if (billingRes.data.success) {
        setBillingStatements(billingRes.data.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch engagement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementDetails();
  }, [id]);

  const handleCreateBilling = async (workOrderId) => {
    try {
      if (!billingAmount || billingAmount <= 0) {
        throw new Error('Please enter a valid billing amount');
      }

      const response = await billingAPI.create(workOrderId, {
        amount: Number(billingAmount),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (response.data.success) {
        setShowBillingForm(false);
        setBillingAmount('');
        fetchEngagementDetails(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to create billing statement');
      }
    } catch (err) {
      setError(err.message || 'Failed to create billing statement');
    }
  };

  const handleMakePayment = async (statementId) => {
    try {
      setProcessingPayment(statementId);
      
      const statement = billingStatements.find(bs => bs.id === statementId);
      if (!statement) {
        throw new Error('Billing statement not found');
      }

      const response = await paymentAPI.processBillingPayment(statementId, {
        amount: statement.balanceAmount,
        engagementId: id
      });

      if (response.data.success) {
        fetchEngagementDetails(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to process payment');
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setError('');

      const response = await engagementAPI.update(id, { status: newStatus });

      if (response.data.success) {
        fetchEngagementDetails(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleEngagementPayment = async () => {
    try {
      setProcessingPayment('engagement');
      
      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      const response = await paymentAPI.processEngagementPayment(id, {
        amount: Number(paymentAmount),
        paymentType: 'ADVANCE_PAYMENT',
        description: paymentDescription || 'Advance payment'
      });

      if (response.data.success) {
        setShowPaymentForm(false);
        setPaymentAmount('');
        setPaymentDescription('');
        fetchEngagementDetails(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to process payment');
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'green',
      'ON_HOLD': 'yellow',
      'PROJECT_SUBMITTED': 'blue',
      'COMPLETED': 'green',
      'CANCELLED': 'red',
      'OPEN': 'blue',
      'IN_PROGRESS': 'yellow',
      'PENDING': 'orange',
      'PARTIALLY_PAID': 'yellow',
      'PAID': 'green',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return <div className="loading">Loading engagement details...</div>;
  }

  if (error && !engagement) {
    return <div className="error-message">{error}</div>;
  }

  if (!engagement) {
    return <div className="error-message">Engagement not found</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Engagement Details</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/engagements')}>
          Back to Engagements
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="engagement-dashboard">
        <div className="engagement-header">
          <h2>Engagement {engagement.engagementId}</h2>
          <span className={`status-badge ${getStatusColor(engagement.status)}`}>
            {engagement.status}
          </span>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Financial Summary</h3>
            </div>
            <div className="card-content">
              <div className="payment-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${engagement.paymentProgress?.percentage || 0}%` }}
                  >
                    {engagement.paymentProgress?.percentage || 0}%
                  </div>
                </div>
                <p className="progress-text">
                  {engagement.paymentProgress?.completed ? 'Fully Paid' : `${engagement.paymentProgress?.remaining?.toLocaleString() || 0} remaining`}
                </p>
              </div>
              
              <div className="summary-row">
                <span>Total Engagement Value:</span>
                <strong>₹{engagement.totalValue?.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Total Paid:</span>
                <strong className="success">₹{engagement.totalPaid?.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Total Billed:</span>
                <strong>₹{engagement.totalBilled?.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Balance Due:</span>
                <strong className={engagement.balanceDue > 0 ? 'warning' : 'success'}>
                  ₹{engagement.balanceDue?.toLocaleString()}
                </strong>
              </div>

              <div className="payment-breakdown">
                <h4>Payment Breakdown</h4>
                <div className="breakdown-item">
                  <span>Upfront Payment:</span>
                  <strong>₹{engagement.paymentBreakdown?.upfront?.toLocaleString() || 0}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Advance Payments:</span>
                  <strong>₹{engagement.paymentBreakdown?.advance?.toLocaleString() || 0}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Billing Payments:</span>
                  <strong>₹{engagement.paymentBreakdown?.billing?.toLocaleString() || 0}</strong>
                </div>
              </div>

              {isClient && engagement.balanceDue > 0 && (
                <div className="payment-action-section">
                  <button
                    className="btn btn-primary btn-large make-payment-btn"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    💳 Make Payment
                  </button>
                  <p className="payment-action-text">
                    Pay any amount from ₹1 to ₹{engagement.balanceDue?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Engagement Info</h3>
            </div>
            <div className="card-content">
              <div className="summary-row">
                <span>Client:</span>
                <strong>{engagement.clientId}</strong>
              </div>
              <div className="summary-row">
                <span>Provider:</span>
                <strong>{engagement.providerId}</strong>
              </div>
              <div className="summary-row">
                <span>Start Date:</span>
                <strong>{new Date(engagement.startDate).toLocaleDateString()}</strong>
              </div>

              {isProvider && (
                <div className="status-update-section">
                  <h4>Update Status</h4>
                  <div className="status-buttons">
                    {engagement.status === 'ACTIVE' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleStatusUpdate('PROJECT_SUBMITTED')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? 'Updating...' : '📤 Submit Project'}
                      </button>
                    )}
                    {engagement.status === 'PROJECT_SUBMITTED' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? 'Updating...' : '✅ Mark as Completed'}
                      </button>
                    )}
                    {engagement.status === 'ON_HOLD' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleStatusUpdate('ACTIVE')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? 'Updating...' : '▶️ Resume Engagement'}
                      </button>
                    )}
                    {engagement.status === 'ACTIVE' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleStatusUpdate('ON_HOLD')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? 'Updating...' : '⏸️ Put on Hold'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Work Orders</h3>
          </div>
          <div className="card-content">
            {workOrders.length === 0 ? (
              <p className="no-data">No work orders found</p>
            ) : (
              workOrders.map((workOrder) => (
                <div key={workOrder.id} className="work-order-card">
                  <div className="work-order-header">
                    <h4>{workOrder.orderNumber}</h4>
                    <span className={`status-badge ${getStatusColor(workOrder.status)}`}>
                      {workOrder.status}
                    </span>
                  </div>
                  <div className="work-order-items">
                    {workOrder.items?.map((item, index) => (
                      <div key={index} className="item-row">
                        <span>{item.name}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.unitPrice?.toLocaleString()}</span>
                        <span>₹{item.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="work-order-total">
                    <strong>Total: ₹{workOrder.totalValue?.toLocaleString()}</strong>
                  </div>
                  {isProvider && !workOrder.isLocked && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowBillingForm(workOrder.id)}
                    >
                      Create Billing Statement
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showBillingForm && (
          <div className="card">
            <div className="card-header">
              <h3>Create Billing Statement</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBillingForm(false)}>
                Cancel
              </button>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label>Billing Amount (₹)</label>
                <input
                  type="number"
                  value={billingAmount}
                  onChange={(e) => setBillingAmount(e.target.value)}
                  min="0"
                  placeholder="Enter amount"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleCreateBilling(showBillingForm)}
              >
                Create Statement
              </button>
            </div>
          </div>
        )}

        {showPaymentForm && (
          <div className="card payment-form-card">
            <div className="card-header">
              <h3>💳 Make Payment</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </button>
            </div>
            <div className="card-content">
              <div className="payment-info-highlight">
                <div className="payment-highlight-item">
                  <span className="label">Total Project Cost:</span>
                  <span className="value">₹{engagement.totalValue?.toLocaleString()}</span>
                </div>
                <div className="payment-highlight-item">
                  <span className="label">Already Paid:</span>
                  <span className="value success">₹{engagement.totalPaid?.toLocaleString()}</span>
                </div>
                <div className="payment-highlight-item">
                  <span className="label">Remaining Balance:</span>
                  <span className="value warning">₹{engagement.balanceDue?.toLocaleString()}</span>
                </div>
              </div>

              <div className="quick-amount-options">
                <h4>Quick Payment Options:</h4>
                <div className="quick-amount-buttons">
                  {[1000, 2000, 5000].map(amount => {
                    if (amount <= engagement.balanceDue) {
                      return (
                        <button
                          key={amount}
                          className="btn btn-secondary quick-amount-btn"
                          onClick={() => setPaymentAmount(amount.toString())}
                        >
                          ₹{amount.toLocaleString()}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    className="btn btn-primary quick-amount-btn"
                    onClick={() => setPaymentAmount(engagement.balanceDue.toString())}
                  >
                    Pay Full Balance
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Or Enter Custom Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  max={engagement.balanceDue}
                  placeholder="Enter amount"
                  className="payment-amount-input"
                />
                <small className="help-text">Maximum amount: ₹{engagement.balanceDue?.toLocaleString()}</small>
              </div>

              <div className="form-group">
                <label>Payment Description (Optional)</label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="e.g., First installment, Second payment, etc."
                />
              </div>

              <button
                className="btn btn-primary btn-large payment-submit-btn"
                onClick={handleEngagementPayment}
                disabled={processingPayment === 'engagement' || !paymentAmount || paymentAmount <= 0}
              >
                {processingPayment === 'engagement' ? 'Processing...' : `Pay ₹${Number(paymentAmount).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3>Billing Statements</h3>
          </div>
          <div className="card-content">
            {billingStatements.length === 0 ? (
              <p className="no-data">No billing statements found</p>
            ) : (
              billingStatements.map((statement) => (
                <div key={statement.id} className="billing-statement-card">
                  <div className="billing-header">
                    <h4>{statement.statementNumber}</h4>
                    <span className={`status-badge ${getStatusColor(statement.status)}`}>
                      {statement.status}
                    </span>
                  </div>
                  <div className="billing-details">
                    <div className="summary-row">
                      <span>Amount:</span>
                      <strong>₹{statement.amount?.toLocaleString()}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Paid:</span>
                      <strong className="success">₹{statement.paidAmount?.toLocaleString()}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Balance:</span>
                      <strong className={statement.balanceAmount > 0 ? 'warning' : 'success'}>
                        ₹{statement.balanceAmount?.toLocaleString()}
                      </strong>
                    </div>
                    <div className="summary-row">
                      <span>Due Date:</span>
                      <strong>{new Date(statement.dueDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                  {isClient && statement.balanceAmount > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMakePayment(statement.id)}
                      disabled={processingPayment === statement.id}
                    >
                      {processingPayment === statement.id ? 'Processing...' : `Pay ₹${statement.balanceAmount?.toLocaleString()}`}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Payment History</h3>
            <span className="payment-count">
              {engagement.paymentHistory?.length || 0} payments
            </span>
          </div>
          <div className="card-content">
            {engagement.paymentHistory?.length === 0 ? (
              <p className="no-data">No payment history found</p>
            ) : (
              <>
                <div className="payment-history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payment ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagement.paymentHistory?.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td>{payment.paymentId}</td>
                          <td>
                            <span className={`payment-type-badge ${payment.paymentType?.toLowerCase()}`}>
                              {payment.paymentType?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>{payment.description || '-'}</td>
                          <td>₹{payment.amount?.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setShowPaymentTracker(payment.id)}
                            >
                              View Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {showPaymentTracker && (
                  <div className="payment-tracker-modal">
                    <div className="payment-tracker-content">
                      <div className="payment-tracker-header">
                        <h3>Payment Status Tracker</h3>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowPaymentTracker(null)}
                        >
                          Close
                        </button>
                      </div>
                      <PaymentStatusTracker paymentId={showPaymentTracker} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementDetails;