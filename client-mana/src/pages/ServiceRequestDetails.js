/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { serviceRequestAPI, proposalAPI, paymentAPI } from '../utils/api';
import PaymentStatusTracker from '../components/PaymentStatusTracker';
import '../style/ServiceRequestDetails.css';

/* ----------------------------- inline icons ----------------------------- */
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconHash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconInbox = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

/* ----------------------------- helpers ---------------------------------- */
const STATUS_CLASS = {
  OPEN: 'is-open',
  PROPOSAL_RECEIVED: 'is-received',
  PROPOSAL_ACCEPTED: 'is-accepted',
  ACCEPTED: 'is-accepted',
  SUBMITTED: 'is-submitted',
  PAYMENT_PENDING: 'is-pending',
  PENDING: 'is-pending',
  ENGAGED: 'is-engaged',
  PROJECT_SUBMITTED: 'is-submitted',
  IN_PROGRESS: 'is-progress',
  COMPLETED: 'is-completed',
  SUCCESS: 'is-completed',
  CANCELLED: 'is-cancelled',
  FAILED: 'is-cancelled',
};

const statusClass = (status) => STATUS_CLASS[String(status).toUpperCase()] || 'is-default';

const prettyStatus = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/* ============================== component =============================== */
const ServiceRequestDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isClient, isProvider } = useRole();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceRequest, setServiceRequest] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [acceptingProposal, setAcceptingProposal] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentTracker, setShowPaymentTracker] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleProjectSubmitted = async () => {
    try {
      setUpdatingStatus(true);
      setError('');

      const response = await serviceRequestAPI.updateStatus(
        serviceRequest.requestId,
        'PROJECT_SUBMITTED'
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Failed to update project status'
        );
      }

      setServiceRequest(response.data.data);

    } catch (err) {
      console.error('Project submission error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to update project status'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };


  const handleProjectCompleted = async () => {
    try {
      setUpdatingStatus(true);
      setError('');

      const response = await serviceRequestAPI.updateStatus(
        serviceRequest.requestId,
        'COMPLETED'
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Failed to complete project'
        );
      }

      setServiceRequest(response.data.data);

    } catch (err) {
      console.error('Project completion error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to complete project'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };


  const fetchPaymentDetails = async (proposalId) => {
    try {
      setLoadingPayments(true);

      const response = await paymentAPI.getByProposalId(proposalId);

      if (response.data.success) {
        setPaymentDetails(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchServiceRequestDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const [requestRes, proposalsRes] = await Promise.all([
        serviceRequestAPI.getById(id),
        serviceRequestAPI.getProposals(id),
      ]);

      if (!requestRes.data.success) {
        throw new Error(
          requestRes.data.message || 'Failed to fetch service request'
        );
      }

      setServiceRequest(requestRes.data.data);

      if (!proposalsRes.data.success) {
        throw new Error(proposalsRes.data.message || 'Failed to fetch proposals');
      }

      const proposalList = proposalsRes.data.data || [];

      console.log('All proposals:', proposalList);

      setProposals(proposalList);

      // Find accepted proposal
      const acceptedProposal = proposalList.find(
        (proposal) => proposal.status?.toUpperCase() === 'ACCEPTED'
      );

      console.log('Accepted proposal:', acceptedProposal);

      if (acceptedProposal) {
        console.log('Fetching payments for proposal:', acceptedProposal.proposalId);
        await fetchPaymentDetails(acceptedProposal.proposalId);
      } else {
        console.log('No accepted proposal found');
        setPaymentDetails(null);
      }
    } catch (err) {
      console.error('Service request details error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch service request details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequestDetails();
  }, [id]);

  const handleAcceptProposal = async (proposalId) => {
    try {
      setAcceptingProposal(proposalId);
      setError('');

      const response = await proposalAPI.accept(proposalId);

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Failed to accept proposal'
        );
      }

      // Change service request status to PAYMENT_PENDING
      const statusResponse = await serviceRequestAPI.updateStatus(
        serviceRequest.requestId,
        'PAYMENT_PENDING'
      );

      if (!statusResponse.data.success) {
        throw new Error(
          statusResponse.data.message ||
          'Failed to update service request status'
        );
      }

      navigate(`/payment/${proposalId}`);

    } catch (err) {
      console.error('Accept proposal error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to accept proposal'
      );

      setAcceptingProposal(null);
    }
  };

  const handleAdditionalPayment = async () => {
    try {
      const acceptedProposal = proposals.find(
        (p) => p.status?.toUpperCase() === 'ACCEPTED'
      );
      if (!acceptedProposal) {
        setError('No accepted proposal found');
        return;
      }

      const amount = Number(paymentAmount);
      if (!amount || amount <= 0) {
        setError('Please enter a valid payment amount');
        return;
      }

      if (amount > paymentDetails.remainingAmount) {
        setError(
          `Payment cannot exceed remaining amount of ${money(
            paymentDetails.remainingAmount
          )}`
        );
        return;
      }

      setProcessingPayment(true);
      setError('');

      const createResponse = await paymentAPI.createPayment({
        proposalId: acceptedProposal.proposalId,
        amount,
      });

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.message || 'Failed to create payment');
      }

      const payment = createResponse.data.data;

      const processResponse = await paymentAPI.processPayment({
        paymentId: payment.paymentId,
        amount,
      });

      if (!processResponse.data.success) {
        throw new Error(processResponse.data.message || 'Payment processing failed');
      }

      const webhookResponse = await paymentAPI.webhook({
        paymentId: payment.paymentId,
        referenceId: processResponse.data.data.transactionReference,
        amount,
        status: 'SUCCESS',
      });

      if (!webhookResponse.data.success) {
        throw new Error(webhookResponse.data.message || 'Payment confirmation failed');
      }

      await fetchPaymentDetails(acceptedProposal.proposalId);

      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentForm(false);

      await fetchServiceRequestDetails();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetPaymentForm = () => {
    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentDescription('');
    setError('');
  };

  /* ------------------------------ loading ------------------------------- */
  if (loading) {
    return (
      <div className="srd-page">
        <div className="srd-loader">
          <div className="srd-spinner" />
          <p>Loading service request details…</p>
        </div>
      </div>
    );
  }

  /* --------------------------- hard error state ------------------------- */
  if (!serviceRequest) {
    return (
      <div className="srd-page">
        <div className="srd-empty srd-empty--error">
          <span className="srd-empty__icon">
            <IconAlert />
          </span>
          <h3>Something went wrong</h3>
          <p>{error || 'Service request not found'}</p>
          <button className="srd-btn srd-btn--primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const paidPercent =
    paymentDetails && Number(paymentDetails.totalAmount) > 0
      ? Math.min(
        100,
        Math.round(
          (Number(paymentDetails.totalPaid) / Number(paymentDetails.totalAmount)) * 100
        )
      )
      : 0;

  const lineItems = serviceRequest.lineItems || [];

  return (
    <div className="srd-page">
      {/* ============================== HERO ============================== */}
      <header className="srd-hero">
        <div className="srd-hero__glow" aria-hidden="true" />

        <div className="srd-hero__top">
          <button className="srd-back" onClick={() => navigate('/')}>
            <IconArrowLeft />
            <span>Dashboard</span>
          </button>

          <span className={`srd-pill ${statusClass(serviceRequest.status)}`}>
            <span className="srd-pill__dot" />
            {prettyStatus(serviceRequest.status)}
          </span>
        </div>

        <h1 className="srd-hero__title">{serviceRequest.title}</h1>

        <div className="srd-hero__meta">
          <span className="srd-chip">
            <IconHash />
            {serviceRequest.requestId}
          </span>
          <span className="srd-chip">
            <IconCalendar />
            {new Date(serviceRequest.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="srd-chip">
            <IconLayers />
            {lineItems.length} item{lineItems.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {/* inline error banner (does not blow away the page) */}
      {error && (
        <div className="srd-alert srd-alert--error">
          <IconAlert />
          <span>{error}</span>
          <button className="srd-alert__close" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      <div className="srd-grid">
        {/* ============================ OVERVIEW ========================= */}
        <section className="srd-card srd-card--wide">
          <div className="srd-card__head">
            <h2>
              <span className="srd-card__icon">
                <IconLayers />
              </span>
              Request Overview
            </h2>
          </div>

          <div className="srd-card__body">
            <p className="srd-label">Description</p>
            <p className="srd-description">{serviceRequest.description}</p>

            <div className="srd-info-grid">
              <div className="srd-info">
                <span className="srd-info__icon">
                  <IconHash />
                </span>
                <div>
                  <span className="srd-info__label">Request ID</span>
                  <span className="srd-info__value">{serviceRequest.requestId}</span>
                </div>
              </div>

              <div className="srd-info">
                <span className="srd-info__icon">
                  <IconCalendar />
                </span>
                <div>
                  <span className="srd-info__label">Created On</span>
                  <span className="srd-info__value">
                    {new Date(serviceRequest.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================== LINE ITEMS ======================== */}
        <section className="srd-card srd-card--wide">
          <div className="srd-card__head">
            <h2>
              <span className="srd-card__icon">
                <IconLayers />
              </span>
              Line Items
            </h2>
            <span className="srd-count">{lineItems.length}</span>
          </div>

          <div className="srd-card__body">
            {lineItems.length === 0 ? (
              <div className="srd-empty srd-empty--inline">
                <span className="srd-empty__icon">
                  <IconInbox />
                </span>
                <p>No line items added to this request.</p>
              </div>
            ) : (
              <div className="srd-items">
                {lineItems.map((item, index) => (
                  <article className="srd-item" key={index}>
                    <div className="srd-item__index">{index + 1}</div>

                    <div className="srd-item__body">
                      <h3 className="srd-item__name">{item.name}</h3>

                      <div className="srd-item__stats">
                        <div className="srd-stat">
                          <span className="srd-stat__label">Quantity</span>
                          <span className="srd-stat__value">{item.quantity}</span>
                        </div>
                        <div className="srd-stat">
                          <span className="srd-stat__label">Target Budget</span>
                          <span className="srd-stat__value srd-stat__value--money">
                            {money(item.targetBudget)}
                          </span>
                        </div>
                        <div className="srd-stat">
                          <span className="srd-stat__label">Timeline</span>
                          <span className="srd-stat__value">{item.expectedTimeline}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>


{/* =========================== PROPOSALS ========================= */}
<section className="srd-card srd-card--wide">
  <div className="srd-card__head">
    <h2>
      <span className="srd-card__icon">
        <IconUser />
      </span>
      Proposals
    </h2>

    <span className="srd-count">{proposals.length}</span>
  </div>

  <div className="srd-card__body">
    {proposals.length === 0 ? (
      <div className="srd-empty srd-empty--inline">
        <span className="srd-empty__icon">
          <IconInbox />
        </span>
        <p>No proposals have been submitted yet.</p>
      </div>
    ) : (
      <div className="srd-items">
        {proposals.map((proposal) => (
          <article className="srd-item" key={proposal.proposalId}>
            <div className="srd-item__index">
              <IconUser />
            </div>

            <div className="srd-item__body">
              <h3 className="srd-item__name">
                {proposal.providerName || 'Provider'}
              </h3>

              <div className="srd-item__stats">
                <div className="srd-stat">
                  <span className="srd-stat__label">
                    Proposal Amount
                  </span>

                  <span className="srd-stat__value srd-stat__value--money">
                    {money(proposal.totalAmount || proposal.amount)}
                  </span>
                </div>

                <div className="srd-stat">
                  <span className="srd-stat__label">
                    Timeline
                  </span>

                  <span className="srd-stat__value">
                    {proposal.timeline || 'Not specified'}
                  </span>
                </div>

                <div className="srd-stat">
                  <span className="srd-stat__label">
                    Status
                  </span>

                  <span
                    className={`srd-pill srd-pill--sm ${statusClass(
                      proposal.status
                    )}`}
                  >
                    {prettyStatus(proposal.status)}
                  </span>
                </div>
              </div>

              {proposal.description && (
                <p className="srd-description">
                  {proposal.description}
                </p>
              )}

              {/* Client can approve submitted proposal */}
              {isClient &&
                proposal.status?.toUpperCase() === 'SUBMITTED' &&
                serviceRequest.status !== 'COMPLETED' && (
                  <div className="srd-cta">
                    <button
                      className="srd-btn srd-btn--primary"
                      onClick={() =>
                        handleAcceptProposal(proposal.proposalId)
                      }
                      disabled={
                        acceptingProposal === proposal.proposalId
                      }
                    >
                      {acceptingProposal === proposal.proposalId ? (
                        <>
                          <span className="srd-btn__spinner" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <IconCheck />
                          Approve Proposal
                        </>
                      )}
                    </button>
                  </div>
                )}

              {/* Already accepted */}
              {proposal.status?.toUpperCase() === 'ACCEPTED' && (
                <div className="srd-cta">
                  <span className="srd-pill is-accepted">
                    <IconCheck />
                    Proposal Approved
                  </span>

                  {isClient &&
                    serviceRequest.status === 'PAYMENT_PENDING' && (
                      <button
                        className="srd-btn srd-btn--primary"
                        onClick={() =>
                          navigate(`/payment/${proposal.proposalId}`)
                        }
                      >
                        <IconCard />
                        Make Payment
                      </button>
                    )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </div>
</section>


        {/* ======================== PAYMENT HISTORY ====================== */}
        {paymentDetails && (
          <section className="srd-card srd-card--wide">
            <div className="srd-card__head">
              <h2>
                <span className="srd-card__icon">
                  <IconCard />
                </span>
                Payment History
              </h2>
            </div>

            <div className="srd-card__body">
              {loadingPayments ? (
                <div className="srd-loader srd-loader--inline">
                  <div className="srd-spinner" />
                  <p>Loading payment history…</p>
                </div>
              ) : (
                <>
                  {/* summary tiles */}
                  <div className="srd-summary">
                    <div className="srd-tile">
                      <span className="srd-tile__label">Total Project Cost</span>
                      <span className="srd-tile__value">
                        {money(paymentDetails.totalAmount)}
                      </span>
                    </div>

                    <div className="srd-tile srd-tile--success">
                      <span className="srd-tile__label">Total Paid</span>
                      <span className="srd-tile__value">
                        {money(paymentDetails.totalPaid)}
                      </span>
                    </div>

                    <div className="srd-tile srd-tile--warn">
                      <span className="srd-tile__label">Remaining</span>
                      <span className="srd-tile__value">
                        {money(paymentDetails.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {/* progress */}
                  <div className="srd-progress">
                    <div className="srd-progress__bar">
                      <div
                        className="srd-progress__fill"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                    <span className="srd-progress__label">{paidPercent}% paid</span>
                  </div>

                  <h3 className="srd-subtitle">Transactions</h3>

                  {paymentDetails.payments?.length === 0 ? (
                    <div className="srd-empty srd-empty--inline">
                      <span className="srd-empty__icon">
                        <IconInbox />
                      </span>
                      <p>No payments have been made yet.</p>
                    </div>
                  ) : (
                    <div className="srd-timeline">
                      {paymentDetails.payments.map((payment, index) => (
                        <div className="srd-timeline__row" key={payment.paymentId || index}>
                          <div className="srd-timeline__marker">
                            <IconCheck />
                          </div>

                          <div className="srd-timeline__main">
                            <strong>Payment #{index + 1}</strong>
                            <span className="srd-timeline__type">
                              {payment.paymentType || 'Partial Payment'}
                            </span>
                            {payment.paidAt && (
                              <span className="srd-timeline__date">
                                <IconClock />
                                {new Date(payment.paidAt).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <div className="srd-timeline__right">
                            <strong className="srd-timeline__amount">
                              {money(payment.amount)}
                            </strong>
                            <span className={`srd-pill srd-pill--sm ${statusClass(payment.status)}`}>
                              {prettyStatus(payment.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* ===================== ADDITIONAL PAYMENT FORM ================= */}
        {isClient && paymentDetails && paymentDetails.remainingAmount > 0 && (
          <section className="srd-card srd-card--wide srd-card--accent">
            <div className="srd-card__head">
              <h2>
                <span className="srd-card__icon">
                  <IconCard />
                </span>
                Make an Additional Payment
              </h2>
            </div>

            <div className="srd-card__body">
              {!showPaymentForm ? (
                <div className="srd-cta">
                  <p className="srd-cta__text">
                    You can pay any amount from <strong>₹1</strong> up to{' '}
                    <strong>{money(paymentDetails.remainingAmount)}</strong>.
                  </p>
                  <button
                    className="srd-btn srd-btn--primary srd-btn--lg"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <IconCard /> Make Payment
                  </button>
                </div>
              ) : (
                <div className="srd-form">
                  <div className="srd-highlights">
                    <div className="srd-highlight">
                      <span className="srd-highlight__label">Total Project Cost</span>
                      <span className="srd-highlight__value">
                        {money(paymentDetails.totalAmount)}
                      </span>
                    </div>
                    <div className="srd-highlight">
                      <span className="srd-highlight__label">Already Paid</span>
                      <span className="srd-highlight__value srd-highlight__value--success">
                        {money(paymentDetails.totalPaid)}
                      </span>
                    </div>
                    <div className="srd-highlight">
                      <span className="srd-highlight__label">Remaining Balance</span>
                      <span className="srd-highlight__value srd-highlight__value--warn">
                        {money(paymentDetails.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="srd-field">
                    <label htmlFor="pay-amount">Payment Amount (₹)</label>
                    <div className="srd-input-wrap">
                      <span className="srd-input-prefix">₹</span>
                      <input
                        id="pay-amount"
                        type="number"
                        min="1"
                        max={paymentDetails.remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === '' ||
                            (Number(value) >= 1 &&
                              Number(value) <= paymentDetails.remainingAmount)
                          ) {
                            setPaymentAmount(value);
                            setError('');
                          } else if (Number(value) > paymentDetails.remainingAmount) {
                            setError(
                              `Maximum payment amount is ${money(
                                paymentDetails.remainingAmount
                              )}`
                            );
                          }
                        }}
                        placeholder="0"
                        disabled={processingPayment}
                      />
                    </div>
                  </div>

                  <div className="srd-field">
                    <label htmlFor="pay-desc">Description (optional)</label>
                    <input
                      id="pay-desc"
                      type="text"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                      placeholder="e.g. Second installment"
                      disabled={processingPayment}
                    />
                  </div>

                  <div className="srd-quick">
                    {[
                      { label: '₹1,000', value: 1000 },
                      { label: '₹2,000', value: 2000 },
                      { label: '₹5,000', value: 5000 },
                    ].map((q) => (
                      <button
                        key={q.value}
                        type="button"
                        className="srd-chip-btn"
                        onClick={() => {
                          setPaymentAmount(
                            Math.min(q.value, paymentDetails.remainingAmount).toString()
                          );
                          setError('');
                        }}
                        disabled={processingPayment}
                      >
                        {q.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="srd-chip-btn srd-chip-btn--accent"
                      onClick={() => {
                        setPaymentAmount(paymentDetails.remainingAmount.toString());
                        setError('');
                      }}
                      disabled={processingPayment}
                    >
                      Pay Full Balance
                    </button>
                  </div>

                  {error && (
                    <div className="srd-alert srd-alert--error">
                      <IconAlert />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="srd-form__actions">
                    <button
                      type="button"
                      className="srd-btn srd-btn--ghost"
                      onClick={resetPaymentForm}
                      disabled={processingPayment}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="srd-btn srd-btn--primary srd-btn--lg"
                      onClick={handleAdditionalPayment}
                      disabled={
                        processingPayment ||
                        !paymentAmount ||
                        Number(paymentAmount) <= 0 ||
                        Number(paymentAmount) > paymentDetails.remainingAmount
                      }
                    >
                      {processingPayment ? (
                        <>
                          <span className="srd-btn__spinner" /> Processing Payment…
                        </>
                      ) : (
                        <>Pay {money(paymentAmount)}</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {isProvider &&
          serviceRequest.status === 'ENGAGED' &&
          paymentDetails &&
          Number(paymentDetails.remainingAmount) === 0 && (
            <section className="srd-card srd-card--wide srd-card--accent">
              <div className="srd-card__head">
                <h2>
                  <span className="srd-card__icon">
                    <IconCheck />
                  </span>
                  Project Submission
                </h2>
              </div>

              <div className="srd-card__body">
                <div className="srd-cta">
                  <p className="srd-cta__text">
                    Full payment has been completed. You can now mark this
                    project as submitted.
                  </p>

                  <button
                    className="srd-btn srd-btn--primary srd-btn--lg"
                    onClick={handleProjectSubmitted}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <span className="srd-btn__spinner" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <IconCheck />
                        Mark Project as Submitted
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

        {/* ============================ EMPTY ============================ */}
        {serviceRequest.status === 'OPEN' && proposals.length === 0 && (
          <section className="srd-card srd-card--wide">
            <div className="srd-card__body">
              <div className="srd-empty">
                <span className="srd-empty__icon">
                  <IconInbox />
                </span>
                <h3>No proposals yet</h3>
                <p>Waiting for providers to submit proposals for this request.</p>
              </div>
            </div>
          </section>
        )}

        {/* ========================== COMPLETED ========================== */}
        {serviceRequest.status === 'COMPLETED' && (
          <section className="srd-card srd-card--wide srd-card--success">
            <div className="srd-card__body">
              <div className="srd-empty">
                <span className="srd-empty__icon srd-empty__icon--success">
                  <IconCheck />
                </span>
                <h3>Request completed</h3>
                <p>
                  This service request has been completed and converted to an engagement.
                </p>
                <button
                  className="srd-btn srd-btn--primary"
                  onClick={() => navigate('/engagements')}
                >
                  View Engagements
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ==================== PAYMENT STATUS TRACKER MODAL ================= */}
      {showPaymentTracker && (
        <div className="srd-modal" onClick={() => setShowPaymentTracker(null)}>
          <div className="srd-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="srd-modal__head">
              <h3>Payment Status Tracker</h3>
              <button
                className="srd-modal__close"
                onClick={() => setShowPaymentTracker(null)}
              >
                ×
              </button>
            </div>
            <PaymentStatusTracker paymentId={showPaymentTracker} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestDetails;