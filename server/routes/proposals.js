const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// GET /api/proposals - Get all proposals
router.get('/', (req, res) => {
  try {
    const proposals = dataStore.get('proposals');
    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposals',
      error: error.message
    });
  }
});



// GET /api/service-requests/:requestId/proposals - Get proposals for a specific request
router.get('/service-requests/:requestId', (req, res) => {
  try {
    const proposals = dataStore.filter('proposals', 
      p => p.requestId === req.params.requestId
    );
    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposals',
      error: error.message
    });
  }
});

// POST /api/proposals - Submit a new proposal
router.post('/', (req, res) => {
  try {
    const { requestId, providerId, price, timeline, terms } = req.body;

    // Validation
    if (!requestId || !providerId || !price || !timeline || !terms) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Check if service request exists and is open
    const serviceRequest = dataStore.findById('serviceRequests', requestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (serviceRequest.status !== 'OPEN' && serviceRequest.status !== 'PROPOSAL_RECEIVED') {
      return res.status(409).json({
        success: false,
        message: 'Cannot submit proposal for this request'
      });
    }

    const proposalId = dataStore.generateProposalNumber();
    const newProposal = {
      id: proposalId,
      proposalId,
      requestId,
      providerId: providerId || 'PR-001',
      price,
      timeline,
      terms,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dataStore.add('proposals', newProposal);

    // Update service request status
    if (serviceRequest.status === 'OPEN') {
      dataStore.update('serviceRequests', requestId, {
        status: 'PROPOSAL_RECEIVED',
        updatedAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      data: newProposal,
      message: 'Proposal submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting proposal',
      error: error.message
    });
  }
});

// POST /api/proposals/:proposalId/accept - Accept a proposal
router.post('/:proposalId/accept', (req, res) => {
  try {
    const proposal = dataStore.findById('proposals', req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    if (proposal.status !== 'SUBMITTED') {
      return res.status(409).json({
        success: false,
        message: 'Can only accept submitted proposals'
      });
    }

    // Update proposal status
    dataStore.update('proposals', req.params.proposalId, {
      status: 'ACCEPTED',
      updatedAt: new Date().toISOString()
    });

    // Reject other proposals for the same request
    const otherProposals = dataStore.filter('proposals', 
      p => p.requestId === proposal.requestId && p.id !== req.params.proposalId
    );
    otherProposals.forEach(p => {
      dataStore.update('proposals', p.id, {
        status: 'REJECTED',
        updatedAt: new Date().toISOString()
      });
    });

    // Update service request status
    dataStore.update('serviceRequests', proposal.requestId, {
      status: 'PROPOSAL_ACCEPTED',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: { ...proposal, status: 'ACCEPTED' },
      message: 'Proposal accepted successfully',
      paymentRequired: proposal.price
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting proposal',
      error: error.message
    });
  }
});

// GET /api/proposals/:id - Get a specific proposal
router.get('/:id', (req, res) => {
  try {
    const proposal = dataStore.findById('proposals', req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposal',
      error: error.message
    });
  }
});

module.exports = router;