const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// GET /api/billing-statements - Get all billing statements
router.get('/', (req, res) => {
  try {
    const billingStatements = dataStore.get('billingStatements');
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

// GET /api/work-orders/:workOrderId/billing-statements - Get billing statements for a work order
router.get('/work-orders/:workOrderId', (req, res) => {
  try {
    const billingStatements = dataStore.filter('billingStatements', 
      bs => bs.workOrderId === req.params.workOrderId
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

// GET /api/billing-statements/:id - Get a specific billing statement
router.get('/:id', (req, res) => {
  try {
    const billingStatement = dataStore.findById('billingStatements', req.params.id);
    if (!billingStatement) {
      return res.status(404).json({
        success: false,
        message: 'Billing statement not found'
      });
    }

    // Get payments for this statement
    const payments = dataStore.filter('payments', 
      p => p.billingStatementId === req.params.id
    );
    const totalPaid = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: {
        ...billingStatement,
        totalPaid,
        balanceAmount: billingStatement.amount - totalPaid,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching billing statement',
      error: error.message
    });
  }
});

// POST /api/work-orders/:workOrderId/billing-statements - Generate a billing statement
router.post('/work-orders/:workOrderId', (req, res) => {
  try {
    const { amount, dueDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const workOrder = dataStore.findById('workOrders', req.params.workOrderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Get engagement
    const engagement = dataStore.findById('engagements', workOrder.engagementId);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found'
      });
    }

    // Calculate total billing for this work order
    const existingBilling = dataStore.filter('billingStatements', 
      bs => bs.workOrderId === req.params.workOrderId
    );
    const totalBilled = existingBilling.reduce((sum, bs) => sum + bs.amount, 0);

    // Validate billing limit
    if (totalBilled + amount > workOrder.totalValue) {
      return res.status(400).json({
        success: false,
        message: `Billing amount exceeds remaining work order balance. Remaining: ${workOrder.totalValue - totalBilled}`
      });
    }

    const billingStatementId = dataStore.generateBillingStatementNumber();
    const billingStatement = {
      id: billingStatementId,
      billingStatementId,
      statementNumber: dataStore.generateBillingStatementNumber(),
      engagementId: workOrder.engagementId,
      workOrderId: req.params.workOrderId,
      amount,
      paidAmount: 0,
      balanceAmount: amount,
      status: 'PENDING',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      createdAt: new Date().toISOString()
    };

    dataStore.add('billingStatements', billingStatement);

    res.status(201).json({
      success: true,
      data: billingStatement,
      message: 'Billing statement created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating billing statement',
      error: error.message
    });
  }
});

// POST /api/billing-statements/:statementId/payments - Make a payment against a billing statement
router.post('/:statementId/payments', (req, res) => {
  try {
    const { amount, engagementId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const billingStatement = dataStore.findById('billingStatements', req.params.statementId);
    if (!billingStatement) {
      return res.status(404).json({
        success: false,
        message: 'Billing statement not found'
      });
    }

    // Check if statement is locked (has payments)
    const existingPayments = dataStore.filter('payments', 
      p => p.billingStatementId === req.params.statementId
    );
    const totalPaid = existingPayments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    // Validate payment limit
    if (amount > billingStatement.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds outstanding balance. Outstanding: ${billingStatement.balanceAmount}`
      });
    }

    // Process payment
    const paymentId = dataStore.generatePaymentNumber();
    const payment = {
      id: paymentId,
      paymentId,
      engagementId: engagementId || billingStatement.engagementId,
      billingStatementId: req.params.statementId,
      amount,
      paymentType: 'BILLING_PAYMENT',
      paymentMethod: 'MOCK_GATEWAY',
      status: 'SUCCESS',
      transactionReference: `TXN-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    dataStore.add('payments', payment);

    // Update billing statement
    const newPaidAmount = totalPaid + amount;
    const newBalanceAmount = billingStatement.amount - newPaidAmount;

    let newStatus = billingStatement.status;
    if (newBalanceAmount === 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    dataStore.update('billingStatements', req.params.statementId, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

module.exports = router;