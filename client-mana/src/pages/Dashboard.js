import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { serviceRequestAPI, engagementAPI, proposalAPI } from '../utils/api';
import '../style/Dashboard.css';

/* ----------------------------- inline icons ----------------------------- */
const IconSpark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconHandshake = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17l-4-4 4-4M13 7l4 4-4 4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconInbox = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ----------------------------- helpers ---------------------------------- */
const STATUS_CLASS = {
  OPEN: 'is-open',
  PROPOSAL_RECEIVED: 'is-received',
  PROPOSAL_ACCEPTED: 'is-accepted',
  PAYMENT_PENDING: 'is-pending',
  ENGAGED: 'is-engaged',
  IN_PROGRESS: 'is-progress',
  PROJECT_SUBMITTED: 'is-progress',
  COMPLETED: 'is-completed',
  CANCELLED: 'is-cancelled',
  ACTIVE: 'is-completed',
  SUBMITTED: 'is-progress',
  ACCEPTED: 'is-accepted',
  REJECTED: 'is-cancelled',
};

const statusClass = (status) => STATUS_CLASS[String(status).toUpperCase()] || 'is-default';

const prettyStatus = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/* ============================== component =============================== */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isClient, isProvider } = useRole();
  const [loading, setLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [isClient, isProvider]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [requestsRes, engagementsRes, proposalsRes] = await Promise.all([
        serviceRequestAPI.getAll(),
        engagementAPI.getAll(),
        proposalAPI.getAll(),
      ]);

      setServiceRequests(requestsRes.data.data || []);
      setEngagements(engagementsRes.data.data || []);
      setProposals(proposalsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="db-page">
        <div className="db-loader">
          <div className="db-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const openRequests = serviceRequests.filter(
    (sr) =>
      sr.status === 'OPEN' ||
      sr.status === 'PROPOSAL_RECEIVED' ||
      sr.status === 'PAYMENT_PENDING'
  );
  const pendingProposals = proposals.filter((p) => p.status === 'SUBMITTED');
  const activeEngagements = engagements.filter((e) => e.status === 'ACTIVE');
  const engagedRequests = serviceRequests.filter((sr) => sr.status === 'ENGAGED');
  const submittedProjects = serviceRequests.filter((sr) => sr.status === 'PROJECT_SUBMITTED');
  const completedProjects = serviceRequests.filter((sr) => sr.status === 'COMPLETED');

  const allActiveEngagements = [
    ...activeEngagements.map((e) => ({ ...e, type: 'engagement' })),
    ...engagedRequests.map((sr) => ({ ...sr, type: 'engaged_request' })),
  ];

  const stats = [
    {
      label: 'Active Requests',
      value: openRequests.length,
      icon: <IconFile />,
      tone: 'blue',
      hint: 'Open & awaiting action',
    },
    {
      label: 'Pending Proposals',
      value: pendingProposals.length,
      icon: <IconChat />,
      tone: 'amber',
      hint: 'Awaiting review',
    },
    {
      label: 'Active Engagements',
      value: allActiveEngagements.length,
      icon: <IconHandshake />,
      tone: 'violet',
      hint: 'In progress now',
    },
    {
      label: 'Submitted Projects',
      value: submittedProjects.length,
      icon: <IconPackage />,
      tone: 'emerald',
      hint: 'Ready for review',
    },
  ];

  /* ---------------------------------------------------------------------- */
  return (
    <div className="db-page">
      {/* ============================== HERO ============================== */}
      <header className="db-hero">
        <div className="db-hero__glow" aria-hidden="true" />
        <div className="db-hero__inner">
          <span className="db-hero__eyebrow">
            <IconSpark />
            Service Marketplace
          </span>
          <h1 className="db-hero__title">
            Welcome back, {isClient ? 'Client' : isProvider ? 'Provider' : 'User'}
          </h1>
          <p className="db-hero__subtitle">
            Manage your service requests, proposals, and engagements — all in one
            place.
          </p>

          <div className="db-hero__actions">
            {isClient && (
              <button
                className="db-btn db-btn--primary db-btn--lg"
                onClick={() => navigate('/service-requests/create')}
              >
                <IconPlus /> Create Request
              </button>
            )}
            <button
              className="db-btn db-btn--ghost db-btn--lg"
              onClick={() => navigate('/engagements')}
            >
              View Engagements <IconArrowRight />
            </button>
          </div>
        </div>
      </header>

      {/* ============================== STATS ============================= */}
      <section className="db-stats">
        {stats.map((s) => (
          <div className={`db-stat db-stat--${s.tone}`} key={s.label}>
            <div className="db-stat__top">
              <span className="db-stat__icon">{s.icon}</span>
              <span className="db-stat__spark" aria-hidden="true" />
            </div>
            <p className="db-stat__value">{s.value}</p>
            <p className="db-stat__label">{s.label}</p>
            <p className="db-stat__hint">{s.hint}</p>
          </div>
        ))}
      </section>

      <div className="db-sections">
        {/* ==================== CLIENT: YOUR REQUESTS ==================== */}
        {isClient && (
          <section className="db-section">
            <div className="db-section__head">
              <div>
                <h2>
                  <span className="db-section__bar db-section__bar--blue" />
                  Your Service Requests
                </h2>
                <p className="db-section__sub">
                  Requests currently open or awaiting payment.
                </p>
              </div>
              <button
                className="db-btn db-btn--primary"
                onClick={() => navigate('/service-requests/create')}
              >
                <IconPlus /> Create Request
              </button>
            </div>

            {openRequests.length === 0 ? (
              <div className="db-empty">
                <span className="db-empty__icon">
                  <IconInbox />
                </span>
                <h3>No open service requests yet</h3>
                <p>Create your first request to start receiving proposals.</p>
                <button
                  className="db-btn db-btn--primary"
                  onClick={() => navigate('/service-requests/create')}
                >
                  <IconPlus /> Create Request
                </button>
              </div>
            ) : (
              <div className="db-grid">
                {openRequests.map((request) => (
                  <article className="db-card" key={request.id}>
                    <div className="db-card__head">
                      <h3 className="db-card__title">{request.title}</h3>
                      <span className={`db-pill ${statusClass(request.status)}`}>
                        <span className="db-pill__dot" />
                        {request.status === 'PAYMENT_PENDING'
                          ? 'Payment Pending'
                          : prettyStatus(request.status)}
                      </span>
                    </div>

                    <p className="db-card__desc">{request.description}</p>

                    <div className="db-card__footer">
                      <button
                        className="db-btn db-btn--soft db-btn--block"
                        onClick={() => navigate(`/service-requests/${request.id}`)}
                      >
                        View Details <IconArrowRight />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================== PROVIDER: AVAILABLE ==================== */}
        {isProvider && (
          <section className="db-section">
            <div className="db-section__head">
              <div>
                <h2>
                  <span className="db-section__bar db-section__bar--emerald" />
                  Available Service Requests
                </h2>
                <p className="db-section__sub">
                  Browse and submit proposals for open requests.
                </p>
              </div>
            </div>

            {openRequests.length === 0 ? (
              <div className="db-empty">
                <span className="db-empty__icon">
                  <IconInbox />
                </span>
                <h3>No open service requests available</h3>
                <p>Check back soon — new requests are posted regularly.</p>
              </div>
            ) : (
              <div className="db-grid">
                {openRequests.map((request) => (
                  <article className="db-card" key={request.id}>
                    <div className="db-card__head">
                      <h3 className="db-card__title">{request.title}</h3>
                      <span className={`db-pill ${statusClass(request.status)}`}>
                        <span className="db-pill__dot" />
                        {prettyStatus(request.status)}
                      </span>
                    </div>

                    <p className="db-card__desc">{request.description}</p>

                    {request.lineItems?.length > 0 && (
                      <div className="db-line-items">
                        <span className="db-line-items__label">Line Items</span>
                        <ul className="db-line-items__list">
                          {request.lineItems.map((item, index) => (
                            <li key={index}>
                              <span className="db-line-items__name">{item.name}</span>
                              <span className="db-line-items__budget">
                                {money(item.targetBudget)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="db-card__footer">
                      {request.status === 'PAYMENT_PENDING' ? (
                        <span className="db-note db-note--warn">
                          Proposal approved — payment pending
                        </span>
                      ) : (
                        <button
                          className="db-btn db-btn--primary db-btn--block"
                          onClick={() =>
                            navigate(`/proposals/submit/${request.id}`)
                          }
                        >
                          Submit Proposal <IconArrowRight />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================== ACTIVE ENGAGEMENTS ==================== */}
        <section className="db-section">
          <div className="db-section__head">
            <div>
              <h2>
                <span className="db-section__bar db-section__bar--violet" />
                Active Engagements
              </h2>
              <p className="db-section__sub">
                Projects currently running under an accepted proposal.
              </p>
            </div>
            <button
              className="db-btn db-btn--ghost"
              onClick={() => navigate('/engagements')}
            >
              View All <IconArrowRight />
            </button>
          </div>

          {allActiveEngagements.length === 0 ? (
            <div className="db-empty">
              <span className="db-empty__icon">
                <IconInbox />
              </span>
              <h3>No active engagements</h3>
              <p>Engagements will appear here once proposals are accepted.</p>
            </div>
          ) : (
            <div className="db-grid">
              {allActiveEngagements.map((item) => (
                <article className="db-card db-card--engagement" key={item.id}>
                  <div className="db-card__head">
                    <div className="db-avatar">
                      {item.type === 'engagement' ? 'EN' : 'SR'}
                    </div>
                    <div className="db-card__titles">
                      <h3 className="db-card__title">
                        {item.type === 'engagement'
                          ? `Engagement ${item.engagementId}`
                          : `Request ${item.requestId}`}
                      </h3>
                      <span className="db-card__sub">
                        <IconUser />
                        {item.type === 'engagement'
                          ? 'Active Engagement'
                          : 'Engaged Request'}
                      </span>
                    </div>
                    <span className={`db-pill ${statusClass(item.status)}`}>
                      <span className="db-pill__dot" />
                      {prettyStatus(item.status)}
                    </span>
                  </div>

                  {item.type === 'engagement' ? (
                    <div className="db-kv">
                      <div className="db-kv__row">
                        <span className="db-kv__label">Total Value</span>
                        <span className="db-kv__value">
                          {money(item.totalValue)}
                        </span>
                      </div>
                      <div className="db-kv__row">
                        <span className="db-kv__label">Total Paid</span>
                        <span className="db-kv__value db-kv__value--success">
                          {money(item.totalPaid)}
                        </span>
                      </div>
                      <div className="db-kv__row">
                        <span className="db-kv__label">Balance Due</span>
                        <span className="db-kv__value db-kv__value--warn">
                          {money(item.balanceDue)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="db-card__desc">{item.description}</p>
                      <p className="db-note db-note--info">
                        Payment made — engagement in progress
                      </p>
                    </>
                  )}

                  <div className="db-card__footer">
                    <button
                      className="db-btn db-btn--soft db-btn--block"
                      onClick={() => {
                        if (item.type === 'engagement') {
                          navigate(`/engagements/${item.id}`);
                        } else {
                          navigate(`/service-requests/${item.id}`);
                        }
                      }}
                    >
                      View Details <IconArrowRight />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ==================== SUBMITTED PROJECTS ==================== */}
        <section className="db-section">
          <div className="db-section__head">
            <div>
              <h2>
                <span className="db-section__bar db-section__bar--amber" />
                Submitted Projects
              </h2>
              <p className="db-section__sub">
                Projects submitted by providers and awaiting review.
              </p>
            </div>
          </div>

          {submittedProjects.length === 0 ? (
            <div className="db-empty">
              <span className="db-empty__icon">
                <IconInbox />
              </span>
              <h3>No submitted projects yet</h3>
              <p>Submitted projects will show up here when providers deliver.</p>
            </div>
          ) : (
            <div className="db-grid">
              {submittedProjects.map((project) => (
                <article className="db-card" key={project.id}>
                  <div className="db-card__head">
                    <h3 className="db-card__title">{project.title}</h3>
                    <span className="db-pill is-progress">
                      <span className="db-pill__dot" />
                      Project Submitted
                    </span>
                  </div>

                  <p className="db-card__desc">{project.description}</p>

                  {project.lineItems?.length > 0 && (
                    <div className="db-line-items">
                      <span className="db-line-items__label">Line Items</span>
                      <ul className="db-line-items__list">
                        {project.lineItems.map((item, index) => (
                          <li key={index}>
                            <span className="db-line-items__name">{item.name}</span>
                            <span className="db-line-items__budget">
                              Qty {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="db-card__footer">
                    <button
                      className="db-btn db-btn--soft db-btn--block"
                      onClick={() =>
                        navigate(`/service-requests/${project.id}`)
                      }
                    >
                      View Project Details <IconArrowRight />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;