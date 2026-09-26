import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { engagementAPI } from '../utils/api';
import '../style/EngegmentList.css';

/* ----------------------------- inline icons ----------------------------- */
const IconHandshake = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17l-4-4 4-4M13 7l4 4-4 4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconHash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconTrend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const IconSpinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/* ----------------------------- helpers ---------------------------------- */
const STATUS_CLASS = {
  ACTIVE: 'is-active',
  ON_HOLD: 'is-hold',
  COMPLETED: 'is-completed',
  CANCELLED: 'is-cancelled',
};

const statusClass = (status) =>
  STATUS_CLASS[String(status).toUpperCase()] || 'is-default';

const prettyStatus = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const percent = (paid, total) => {
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((Number(paid) / t) * 100)));
};

/* ============================== component =============================== */
const EngagementList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engagements, setEngagements] = useState([]);

  useEffect(() => {
    fetchEngagements();
  }, []);

  const fetchEngagements = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await engagementAPI.getAll();

      if (response.data.success) {
        setEngagements(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch engagements');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch engagements');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ loading ------------------------------ */
  if (loading) {
    return (
      <div className="el-page">
        <div className="el-loader">
          <div className="el-spinner" />
          <p>Loading engagements…</p>
        </div>
      </div>
    );
  }

  /* -------------------------------- error ------------------------------ */
  if (error) {
    return (
      <div className="el-page">
        <div className="el-empty el-empty--error">
          <span className="el-empty__icon">
            <IconAlert />
          </span>
          <h3>Couldn't load engagements</h3>
          <p>{error}</p>
          <div className="el-empty__actions">
            <button className="el-btn el-btn--primary" onClick={fetchEngagements}>
              Try Again
            </button>
            <button className="el-btn el-btn--ghost" onClick={() => navigate('/')}>
              <IconArrowLeft /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ derived ------------------------------ */
  const totalValue = engagements.reduce(
    (sum, e) => sum + Number(e.totalValue || 0),
    0
  );
  const totalPaid = engagements.reduce(
    (sum, e) => sum + Number(e.totalPaid || 0),
    0
  );
  const totalBalance = engagements.reduce(
    (sum, e) => sum + Number(e.balanceDue || 0),
    0
  );
  const activeCount = engagements.filter(
    (e) => e.status?.toUpperCase() === 'ACTIVE'
  ).length;

  const stats = [
    {
      label: 'Total Engagements',
      value: engagements.length,
      icon: <IconHandshake />,
      tone: 'violet',
      hint: 'All projects ever created',
    },
    {
      label: 'Active Now',
      value: activeCount,
      icon: <IconTrend />,
      tone: 'emerald',
      hint: 'Currently in progress',
    },
    {
      label: 'Total Value',
      value: money(totalValue),
      icon: <IconWallet />,
      tone: 'blue',
      hint: 'Across all engagements',
    },
    {
      label: 'Outstanding Balance',
      value: money(totalBalance),
      icon: <IconWallet />,
      tone: totalBalance > 0 ? 'amber' : 'emerald',
      hint: totalBalance > 0 ? 'Awaiting payment' : 'Fully settled',
    },
  ];

  /* ---------------------------------------------------------------------- */
  return (
    <div className="el-page">
      {/* ============================== HERO ============================== */}
      <header className="el-hero">
        <div className="el-hero__glow" aria-hidden="true" />
        <div className="el-hero__inner">
          <button className="el-back" onClick={() => navigate('/')}>
            <IconArrowLeft />
            <span>Dashboard</span>
          </button>

          <span className="el-hero__eyebrow">
            <IconHandshake />
            Engagements
          </span>

          <h1 className="el-hero__title">Your Active Engagements</h1>

          <p className="el-hero__subtitle">
            Track financial progress, monitor project value, and manage every
            engagement in one place.
          </p>
        </div>
      </header>

      {/* ============================== STATS ============================= */}
      {engagements.length > 0 && (
        <section className="el-stats">
          {stats.map((s) => (
            <div className={`el-stat el-stat--${s.tone}`} key={s.label}>
              <div className="el-stat__top">
                <span className="el-stat__icon">{s.icon}</span>
                <span className="el-stat__spark" aria-hidden="true" />
              </div>
              <p className="el-stat__value">{s.value}</p>
              <p className="el-stat__label">{s.label}</p>
              <p className="el-stat__hint">{s.hint}</p>
            </div>
          ))}
        </section>
      )}

      {/* ============================ LIST / EMPTY ========================= */}
      {engagements.length === 0 ? (
        <div className="el-empty-wrap">
          <div className="el-empty">
            <span className="el-empty__icon">
              <IconInbox />
            </span>
            <h3>No engagements yet</h3>
            <p>
              Complete a service request payment to create your first engagement.
              Once accepted, projects will show up here with full financial
              tracking.
            </p>
            <button
              className="el-btn el-btn--primary el-btn--lg"
              onClick={() => navigate('/')}
            >
              Go to Dashboard <IconArrowRight />
            </button>
          </div>
        </div>
      ) : (
        <section className="el-grid">
          {engagements.map((engagement) => {
            const paid = Number(engagement.totalPaid || 0);
            const total = Number(engagement.totalValue || 0);
            const balance = Number(engagement.balanceDue || 0);
            const pct = percent(paid, total);
            const isSettled = balance <= 0;

            return (
              <article className="el-card" key={engagement.id}>
                {/* card head */}
                <div className="el-card__head">
                  <div className="el-avatar">
                    <IconHandshake />
                  </div>

                  <div className="el-card__titles">
                    <h2 className="el-card__title">
                      Engagement {engagement.engagementId}
                    </h2>
                    <span className="el-card__sub">
                      <IconCalendar />
                      Started{' '}
                      {new Date(engagement.startDate).toLocaleDateString(
                        'en-IN',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </span>
                  </div>

                  <span className={`el-pill ${statusClass(engagement.status)}`}>
                    <span className="el-pill__dot" />
                    {prettyStatus(engagement.status)}
                  </span>
                </div>

                {/* parties */}
                <div className="el-parties">
                  <div className="el-party">
                    <span className="el-party__label">Client</span>
                    <span className="el-party__value">
                      <IconUser />
                      {engagement.clientId}
                    </span>
                  </div>
                  <div className="el-party">
                    <span className="el-party__label">Provider</span>
                    <span className="el-party__value">
                      <IconUser />
                      {engagement.providerId}
                    </span>
                  </div>
                </div>

                {/* financial summary */}
                <div className="el-finance">
                  <div className="el-finance__head">
                    <span className="el-finance__label">Financial Summary</span>
                    <span className="el-finance__pct">{pct}% paid</span>
                  </div>

                  <div className="el-progress">
                    <div
                      className={`el-progress__fill ${isSettled ? 'is-complete' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="el-kv">
                    <div className="el-kv__row">
                      <span className="el-kv__label">Total Value</span>
                      <span className="el-kv__value">{money(total)}</span>
                    </div>
                    <div className="el-kv__row">
                      <span className="el-kv__label">Total Paid</span>
                      <span className="el-kv__value el-kv__value--success">
                        {money(paid)}
                      </span>
                    </div>
                    <div className="el-kv__row">
                      <span className="el-kv__label">Balance Due</span>
                      <span
                        className={`el-kv__value ${
                          isSettled
                            ? 'el-kv__value--success'
                            : 'el-kv__value--warn'
                        }`}
                      >
                        {isSettled && (
                          <span className="el-kv__check">
                            <IconCheck />
                          </span>
                        )}
                        {money(balance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* action */}
                <div className="el-card__footer">
                  <button
                    className="el-btn el-btn--primary el-btn--block"
                    onClick={() => navigate(`/engagements/${engagement.id}`)}
                  >
                    View Details <IconArrowRight />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default EngagementList;