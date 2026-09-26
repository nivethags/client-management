import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceRequestAPI } from '../utils/api';

const CreateServiceRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lineItems: [
      {
        name: '',
        quantity: 1,
        targetBudget: 0,
        expectedTimeline: ''
      }
    ]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: field === 'quantity' || field === 'targetBudget' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      lineItems: updatedLineItems
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          name: '',
          quantity: 1,
          targetBudget: 0,
          expectedTimeline: ''
        }
      ]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error('Title and description are required');
      }

      const validLineItems = formData.lineItems.filter(
        item => item.name.trim() && item.quantity > 0 && item.targetBudget >= 0 && item.expectedTimeline.trim()
      );

      if (validLineItems.length === 0) {
        throw new Error('At least one valid line item is required');
      }

      const requestData = {
        clientId: 'CL-001',
        title: formData.title,
        description: formData.description,
        lineItems: validLineItems
      };

      const response = await serviceRequestAPI.create(requestData);
      
      if (response.data.success) {
        navigate(`/service-requests/${response.data.data.id}`);
      } else {
        throw new Error(response.data.message || 'Failed to create service request');
      }
    } catch (err) {
      setError(err.message || 'Failed to create service request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create Service Request</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="title">Request Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter request title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Describe the work you need"
            rows="4"
          />
        </div>

        <div className="line-items-section">
          <h3>Line Items</h3>
          {formData.lineItems.map((item, index) => (
            <div key={index} className="line-item-card">
              <div className="line-item-header">
                <h4>Item {index + 1}</h4>
                {formData.lineItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label>Task/Deliverable *</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                  placeholder="e.g., Website Development"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Target Budget (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={item.targetBudget}
                    onChange={(e) => handleLineItemChange(index, 'targetBudget', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Expected Timeline *</label>
                <input
                  type="text"
                  value={item.expectedTimeline}
                  onChange={(e) => handleLineItemChange(index, 'expectedTimeline', e.target.value)}
                  placeholder="e.g., 30 days"
                  required
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addLineItem}
          >
            + Add Line Item
          </button>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateServiceRequest;