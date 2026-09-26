import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../utils/api';

const PaymentStatusTracker = ({ paymentId }) => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await paymentAPI.getPaymentStatus(paymentId);
        if (response.data.success) {
          setStatusData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentStatus();
    }
  }, [paymentId]);

  if (loading) {
    return <div className="payment-status-loading">Loading payment status...</div>;
  }

  if (!statusData) {
    return null;
  }

  const getStepStatusColor = (status) => {
    const colors = {
      'COMPLETED': 'green',
      'IN_PROGRESS': 'blue',
      'FAILED': 'red',
      'PENDING': 'gray'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="payment-status-tracker">
      <h4>Payment Status Tracking</h4>
      <div className="payment-progress-overview">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${statusData.progress?.percentage || 0}%` }}
          >
            {statusData.progress?.percentage || 0}%
          </div>
        </div>
        <p className="progress-text">
          {statusData.progress?.completedSteps || 0} of {statusData.progress?.totalSteps || 0} steps completed
        </p>
      </div>
      <div className="payment-steps-list">
        {statusData.steps?.map((step, index) => (
          <div key={index} className="payment-step-item">
            <div className="step-header">
              <span className="step-number">{index + 1}</span>
              <span className="step-name">{step.step.replace(/_/g, ' ')}</span>
              <span className={`step-status ${getStepStatusColor(step.status)}`}>
                {step.status}
              </span>
            </div>
            <div className="step-description">{step.description}</div>
            <div className="step-timestamp">
              {new Date(step.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentStatusTracker;