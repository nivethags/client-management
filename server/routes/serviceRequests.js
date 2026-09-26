const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// GET /api/service-requests - Get all service requests
router.get('/', (req, res) => {
  try {
    const requests = dataStore.get('serviceRequests');
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service requests',
      error: error.message
    });
  }
});

// GET /api/service-requests/:id - Get a specific service request
router.get('/:id', (req, res) => {
  try {
    const request = dataStore.findById('serviceRequests', req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service request',
      error: error.message
    });
  }
});
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      'OPEN',
      'PROPOSAL_RECEIVED',
      'PROPOSAL_ACCEPTED',
      'PAYMENT_PENDING',
      'ENGAGED',
      'PROJECT_SUBMITTED',
      'COMPLETED',
      'CANCELLED'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const serviceRequest = dataStore.findById(
      'serviceRequests',
      req.params.id
    );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    dataStore.update(
      'serviceRequests',
      req.params.id,
      {
        status,
        updatedAt: new Date().toISOString()
      }
    );

    const updatedRequest = dataStore.findById(
      'serviceRequests',
      req.params.id
    );

    res.json({
      success: true,
      message: `Service request status updated to ${status}`,
      data: updatedRequest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service request status',
      error: error.message
    });
  }
});

// POST /api/service-requests - Create a new service request
router.post('/', (req, res) => {
  try {
    const { clientId, title, description, lineItems } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required'
      });
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.name || !item.quantity || !item.targetBudget || !item.expectedTimeline) {
        return res.status(400).json({
          success: false,
          message: 'All line item fields are required'
        });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      if (item.targetBudget < 0) {
        return res.status(400).json({
          success: false,
          message: 'Target budget cannot be negative'
        });
      }
    }

    const requestId = dataStore.generateRequestNumber();
    const newRequest = {
      id: requestId,
      requestId,
      clientId: clientId || 'CL-001',
      title,
      description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineItems: lineItems.map((item, index) => ({
        lineItemId: `LI-${Date.now()}-${index}`,
        ...item
      }))
    };

    dataStore.add('serviceRequests', newRequest);

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Service request created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service request',
      error: error.message
    });
  }
});

// PUT /api/service-requests/:id - Update a service request
router.put('/:id', (req, res) => {
  try {
    const { title, description, lineItems, status } = req.body;

    const existingRequest = dataStore.findById('serviceRequests', req.params.id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Check if request is locked
    if (existingRequest.status === 'PROPOSAL_ACCEPTED' ||
      existingRequest.status === 'PAYMENT_PENDING' ||
      existingRequest.status === 'COMPLETED') {
      return res.status(409).json({
        success: false,
        message: 'Cannot modify a locked service request'
      });
    }

    const updates = {
      ...(title && { title }),
      ...(description && { description }),
      ...(lineItems && { lineItems }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    const updatedRequest = dataStore.update('serviceRequests', req.params.id, updates);

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Service request updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating service request',
      error: error.message
    });
  }
});

// PATCH /api/service-requests/:id/cancel - Cancel a service request
router.patch('/:id/cancel', (req, res) => {
  try {
    const existingRequest = dataStore.findById('serviceRequests', req.params.id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Check if request can be cancelled
    if (existingRequest.status === 'COMPLETED' || existingRequest.status === 'CANCELLED') {
      return res.status(409).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled request'
      });
    }

    const updatedRequest = dataStore.update('serviceRequests', req.params.id, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Service request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling service request',
      error: error.message
    });
  }
});

module.exports = router;