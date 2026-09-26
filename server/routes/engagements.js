const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// GET /api/engagements - Get all engagements
router.get('/', (req, res) => {
  try {
    const engagements = dataStore.get('engagements');
    res.json({
      success: true,
      data: engagements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching engagements',
      error: error.message
    });
  }
});

// GET /api/engagements/:id - Get a specific engagement
router.get('/:id', (req, res) => {
  try {
    const engagement = dataStore.findById('engagements', req.params.id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found'
      });
    }

    // Calculate payment totals
    const payments = dataStore.filter('payments', p => p.engagementId === req.params.id);
    const successfulPayments = payments.filter(p => p.status === 'SUCCESS');
    const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get billing statements
    const billingStatements = dataStore.filter('billingStatements', 
      bs => bs.engagementId === req.params.id
    );
    const totalBilled = billingStatements.reduce((sum, bs) => sum + bs.amount, 0);

    // Calculate payment breakdown by type
    const paymentBreakdown = {
      upfront: successfulPayments.filter(p => p.paymentType === 'UPFRONT_PAYMENT').reduce((sum, p) => sum + p.amount, 0),
      advance: successfulPayments.filter(p => p.paymentType === 'ADVANCE_PAYMENT').reduce((sum, p) => sum + p.amount, 0),
      billing: successfulPayments.filter(p => p.paymentType === 'BILLING_PAYMENT').reduce((sum, p) => sum + p.amount, 0),
    };

    // Calculate payment progress
    const paymentProgress = {
      percentage: Math.round((totalPaid / engagement.totalValue) * 100),
      remaining: engagement.totalValue - totalPaid,
      completed: totalPaid >= engagement.totalValue
    };

    const engagementData = {
      ...engagement,
      totalPaid,
      totalBilled,
      balanceDue: engagement.totalValue - totalPaid,
      paymentHistory: payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      billingStatements,
      paymentBreakdown,
      paymentProgress
    };

    res.json({
      success: true,
      data: engagementData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching engagement',
      error: error.message
    });
  }
});

// PATCH /api/engagements/:id - Update engagement status
router.patch('/:id', (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['ACTIVE', 'ON_HOLD', 'PROJECT_SUBMITTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const engagement = dataStore.findById('engagements', req.params.id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found'
      });
    }

    const updatedEngagement = dataStore.update('engagements', req.params.id, {
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: updatedEngagement,
      message: 'Engagement updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating engagement',
      error: error.message
    });
  }
});

// GET /api/engagements/:engagementId/billing-statements - Get billing statements for engagement
router.get('/:engagementId/billing-statements', (req, res) => {
  try {
    const billingStatements = dataStore.filter('billingStatements', 
      bs => bs.engagementId === req.params.engagementId
    );
    res.json({
      success: true,
      data: billingStatements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching billing statements',
      error: error.message
    });
  }
});

module.exports = router;