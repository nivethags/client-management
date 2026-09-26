/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceRequestAPI, proposalAPI } from '../utils/api';

const ProposalSubmission = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serviceRequest, setServiceRequest] = useState(null);
  
  const [formData, setFormData] = useState({
    providerId: 'PR-001',
    price: 0,
    timeline: '',
    terms: ''
  });

  const fetchServiceRequest = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestAPI.getById(requestId);

      if (response.data.success) {
        setServiceRequest(response.data.data);
        
        // Calculate total budget from line items
        const totalBudget = response.data.data.lineItems?.reduce(
          (sum, item) => sum + (item.quantity * item.targetBudget), 0
        ) || 0;
        
        setFormData(prev => ({
          ...prev,
          price: totalBudget
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch service request');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch service request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequest();
  }, [requestId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.price || formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (!formData.timeline.trim()) {
        throw new Error('Timeline is required');
      }
      if (!formData.terms.trim()) {
        throw new Error('Terms are required');
      }

      const proposalData = {
        requestId,
        providerId: formData.providerId,
        price: formData.price,
        timeline: formData.timeline,
        terms: formData.terms
      };

      const response = await proposalAPI.create(proposalData);

      if (response.data.success) {
        navigate(`/service-requests/${requestId}`);
      } else {
        throw new Error(response.data.message || 'Failed to submit proposal');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading service request...</div>;
  }

  if (error && !serviceRequest) {
    return <div className="error-message">{error}</div>;
  }

  if (!serviceRequest) {
    return <div className="error-message">Service request not found</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Submit Proposal</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="proposal-submission-container">
        <div className="card">
          <div className="card-header">
            <h2>Service Request Details</h2>
          </div>
          <div className="card-content">
            <h3>{serviceRequest.title}</h3>
            <p>{serviceRequest.description}</p>
            
            <div className="line-items">
              <h4>Required Work:</h4>
              {serviceRequest.lineItems?.map((item, index) => (
                <div key={index} className="line-item-display">
                  <div className="line-item-info">
                    <strong>{item.name}</strong>
                    <span>Quantity: {item.quantity}</span>
                    <span>Target Budget: ₹{item.targetBudget?.toLocaleString()}</span>
                    <span>Expected Timeline: {item.expectedTimeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Your Proposal</h2>
          </div>
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                required
                placeholder="Enter your price"
              />
              <small>Based on client's target budget</small>
            </div>

            <div className="form-group">
              <label htmlFor="timeline">Timeline *</label>
              <input
                type="text"
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                required
                placeholder="e.g., 35 days"
              />
            </div>

            <div className="form-group">
              <label htmlFor="terms">Terms & Conditions *</label>
              <textarea
                id="terms"
                name="terms"
                value={formData.terms}
                onChange={handleInputChange}
                required
                placeholder="Describe your terms, payment schedule, deliverables, etc."
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProposalSubmission;