import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { proposalAPI, paymentAPI } from '../utils/api';
import PaymentStatusTracker from '../components/PaymentStatusTracker';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { proposalId } = useParams();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [proposal, setProposal] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [showStatusTracker, setShowStatusTracker] = useState(false);

  // -----------------------------------------
  // Fetch proposal + payment information
  // -----------------------------------------
  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const proposalResponse = await proposalAPI.getById(proposalId);

      if (!proposalResponse.data.success) {
        throw new Error(
          proposalResponse.data.message || 'Failed to fetch proposal'
        );
      }

      const proposalData = proposalResponse.data.data;

      setProposal(proposalData);

      // Get payment history for this proposal
      const paymentResponse = await paymentAPI.getByProposalId(proposalId);

      if (!paymentResponse.data.success) {
        throw new Error(
          paymentResponse.data.message || 'Failed to fetch payment details'
        );
      }

      const paymentData = paymentResponse.data.data;

      setPaymentHistory(paymentData.payments || []);
      setTotalPaid(paymentData.totalPaid || 0);
      setRemainingAmount(paymentData.remainingAmount || proposalData.price);
    } catch (err) {
      console.error('Payment details error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch payment details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [proposalId]);

  // -----------------------------------------
  // Handle amount input
  // -----------------------------------------
  const handleAmountChange = (e) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      setPaymentAmount('');
      setError('');
      return;
    }

    // Only allow numbers
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const numericValue = Number(value);

    if (numericValue > remainingAmount) {
      setError(
        `Maximum payment amount is ₹${remainingAmount.toLocaleString()}`
      );
      return;
    }

    setError('');
    setPaymentAmount(value);
  };

  // -----------------------------------------
  // Pay remaining amount button
  // -----------------------------------------
  const handlePayRemaining = () => {
    setPaymentAmount(remainingAmount.toString());
    setError('');
  };

  // -----------------------------------------
  // Process partial payment
  // -----------------------------------------
  const handlePayment = async () => {
    try {
      setError('');

      const amount = Number(paymentAmount);

      // Validation
      if (!amount || amount <= 0) {
        setError('Please enter a valid payment amount.');
        return;
      }

      if (amount > remainingAmount) {
        setError(
          `Payment cannot exceed the remaining amount of ₹${remainingAmount.toLocaleString()}`
        );
        return;
      }

      setProcessing(true);

      // -----------------------------------------
      // Step 1: Create payment
      // -----------------------------------------
      const paymentResponse = await paymentAPI.createPayment({
        proposalId,
        amount
      });

      if (!paymentResponse.data.success) {
        throw new Error(
          paymentResponse.data.message || 'Failed to create payment'
        );
      }

      const createdPayment = paymentResponse.data.data;

      // -----------------------------------------
      // Step 2: Process mock payment
      // -----------------------------------------
      const processResponse = await paymentAPI.processPayment({
        paymentId: createdPayment.paymentId,
        amount
      });

      if (!processResponse.data.success) {
        throw new Error(
          processResponse.data.message || 'Payment processing failed'
        );
      }

      // -----------------------------------------
      // Step 3: Webhook / payment confirmation
      // -----------------------------------------
      const webhookResponse = await paymentAPI.webhook({
        paymentId: createdPayment.paymentId,
        referenceId:
          processResponse.data.data.transactionReference,
        amount,
        status: 'SUCCESS'
      });

      if (!webhookResponse.data.success) {
        throw new Error(
          webhookResponse.data.message || 'Payment confirmation failed'
        );
      }

      // -----------------------------------------
      // Payment successful
      // -----------------------------------------
      setCurrentPaymentId(createdPayment.paymentId);
      setPaymentSuccess(true);

      // Refresh payment details after successful payment
      await fetchPaymentDetails();

      setPaymentAmount('');
    } catch (err) {
      console.error('Payment error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Payment processing failed'
      );
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------------------
  // Loading
  // -----------------------------------------
  if (loading) {
    return (
      <div className="loading">
        Loading payment details...
      </div>
    );
  }

  // -----------------------------------------
  // Error without proposal
  // -----------------------------------------
  if (error && !proposal) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="error-message">
        Proposal not found
      </div>
    );
  }

  // -----------------------------------------
  // Payment success
  // -----------------------------------------
  if (paymentSuccess) {
    return (
      <div className="page-container">
        <div className="payment-success-container">

          <div className="success-icon">
            ✓
          </div>

          <h1>Payment Successful!</h1>

          <p>
            ₹{Number(paymentAmount || 0).toLocaleString()} has been
            successfully paid.
          </p>

          <p>
            Your payment has been recorded successfully.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => {
              setPaymentSuccess(false);
              fetchPaymentDetails();
            }}
          >
            View Payment Details
          </button>

        </div>
      </div>
    );
  }

  // -----------------------------------------
  // Main UI
  // -----------------------------------------
  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>Project Payment</h1>

          <p>
            Make a partial payment based on your preference.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="payment-container">

        {/* =====================================
            PAYMENT SUMMARY
        ====================================== */}
        <div className="card">

          <div className="card-header">
            <h2>Payment Summary</h2>
          </div>

          <div className="card-content">

            <div className="payment-summary">

              <div className="summary-row">
                <span>Proposal ID:</span>
                <strong>{proposal.proposalId}</strong>
              </div>

              <div className="summary-row">
                <span>Provider:</span>
                <strong>{proposal.providerId}</strong>
              </div>

              <div className="summary-row">
                <span>Total Project Cost:</span>
                <strong>
                  ₹{Number(proposal.price || 0).toLocaleString()}
                </strong>
              </div>

              <div className="summary-row">
                <span>Total Paid:</span>
                <strong className="paid-amount">
                  ₹{Number(totalPaid).toLocaleString()}
                </strong>
              </div>

              <div className="summary-row">
                <span>Remaining Amount:</span>
                <strong className="remaining-amount">
                  ₹{Number(remainingAmount).toLocaleString()}
                </strong>
              </div>

            </div>

            {/* =====================================
                PAYMENT PROGRESS
            ====================================== */}

            <div className="payment-progress">

              <div className="progress-header">
                <span>Payment Progress</span>

                <strong>
                  {proposal.price > 0
                    ? Math.round(
                        (totalPaid / proposal.price) * 100
                      )
                    : 0}
                  %
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      proposal.price > 0
                        ? Math.min(
                            (totalPaid / proposal.price) * 100,
                            100
                          )
                        : 0
                    }%`
                  }}
                />
              </div>

            </div>

          </div>

        </div>

        {/* =====================================
            MAKE PAYMENT
        ====================================== */}

        {remainingAmount > 0 ? (
          <div className="card">

            <div className="card-header">
              <h2>Make a Payment</h2>
            </div>

            <div className="card-content">

              <p>
                You can pay any amount up to the remaining
                project balance.
              </p>

              <div className="payment-input-section">

                <label htmlFor="paymentAmount">
                  Amount You Want to Pay
                </label>

                <div className="amount-input-wrapper">
                  <span>₹</span>

                  <input
                    id="paymentAmount"
                    type="number"
                    min="1"
                    max={remainingAmount}
                    step="0.01"
                    value={paymentAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    disabled={processing}
                  />
                </div>

                <small>
                  Maximum payable amount:
                  {' '}
                  ₹{Number(remainingAmount).toLocaleString()}
                </small>

              </div>

              <div className="payment-actions">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePayRemaining}
                  disabled={processing}
                >
                  Pay Remaining ₹
                  {Number(remainingAmount).toLocaleString()}
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handlePayment}
                  disabled={
                    processing ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0 ||
                    Number(paymentAmount) > remainingAmount
                  }
                >
                  {processing
                    ? 'Processing Payment...'
                    : `Pay ₹${
                        Number(paymentAmount || 0).toLocaleString()
                      }`}
                </button>

              </div>

            </div>

          </div>
        ) : (
          <div className="card">

            <div className="card-content payment-completed">

              <div className="success-icon">
                ✓
              </div>

              <h2>Payment Completed</h2>

              <p>
                The full project amount has been paid.
              </p>

              <strong>
                ₹{Number(proposal.price).toLocaleString()}
              </strong>

            </div>

          </div>
        )}

        {/* =====================================
            PAYMENT HISTORY
        ====================================== */}

        <div className="card">

          <div className="card-header">
            <h2>Payment History</h2>
          </div>

          <div className="card-content">

            {paymentHistory.length === 0 ? (
              <p>
                No payments have been made yet.
              </p>
            ) : (
              <div className="payment-history">

                {paymentHistory.map((payment, index) => (
                  <div
                    className="payment-history-item"
                    key={payment.paymentId || index}
                  >

                    <div>
                      <strong>
                        Payment #{index + 1}
                      </strong>

                      <p>
                        {payment.paymentType ||
                          'Partial Payment'}
                      </p>

                      {payment.paidAt && (
                        <small>
                          {new Date(
                            payment.paidAt
                          ).toLocaleString()}
                        </small>
                      )}
                    </div>

                    <div className="payment-history-right">

                      <strong>
                        ₹{Number(
                          payment.amount || 0
                        ).toLocaleString()}
                      </strong>

                      <span
                        className={`payment-status ${
                          payment.status?.toLowerCase()
                        }`}
                      >
                        {payment.status}
                      </span>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCurrentPaymentId(payment.paymentId);
                          setShowStatusTracker(true);
                        }}
                      >
                        Track Status
                      </button>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

        {/* Payment Status Tracker Modal */}
        {showStatusTracker && currentPaymentId && (
          <div className="payment-tracker-modal">
            <div className="payment-tracker-content">
              <div className="payment-tracker-header">
                <h3>Payment Status Tracker</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowStatusTracker(false);
                    setCurrentPaymentId(null);
                  }}
                >
                  Close
                </button>
              </div>
              <PaymentStatusTracker paymentId={currentPaymentId} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentPage;