const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// POST /api/payments/upfront - Process upfront payment
router.post('/upfront', (req, res) => {
  try {
    const { proposalId, amount } = req.body;

    if (!proposalId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Proposal ID and amount are required'
      });
    }

    const proposal = dataStore.findById('proposals', proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    if (proposal.status !== 'ACCEPTED') {
      return res.status(409).json({
        success: false,
        message: 'Proposal must be accepted before payment'
      });
    }

    // Create a pending payment record for tracking
    const paymentId = dataStore.generatePaymentNumber();
    const pendingPayment = {
      id: paymentId,
      paymentId,
      proposalId,
      amount,
      paymentType: 'UPFRONT_PAYMENT',
      paymentMethod: 'MOCK_GATEWAY',
      status: 'INITIATED',
      currentStep: 'PAYMENT_GATEWAY_READY',
      steps: [
        {
          step: 'INITIATED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment request initiated'
        },
        {
          step: 'GATEWAY_READY',
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
          description: 'Waiting for payment gateway processing'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dataStore.add('payments', pendingPayment);

    // Return payment info for the mock gateway
    res.json({
      success: true,
      data: {
        paymentId,
        proposalId,
        amount,
        paymentType: 'UPFRONT_PAYMENT',
        status: 'INITIATED',
        currentStep: 'PAYMENT_GATEWAY_READY',
        message: 'Payment initiated. Proceed to mock payment gateway.',
        nextSteps: ['Process payment through gateway', 'Wait for webhook confirmation']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initiating payment',
      error: error.message
    });
  }
});

// GET /api/payments/proposal/:proposalId
// Get payment summary and payment history for a proposal
router.get('/proposal/:proposalId', (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = dataStore.findById('proposals', proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const payments = dataStore.filter(
      'payments',
      p => p.proposalId === proposalId && p.status === 'SUCCESS'
    );

    const totalAmount = Number(proposal.price || 0);

    const totalPaid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const remainingAmount = Math.max(totalAmount - totalPaid, 0);

    res.json({
      success: true,
      data: {
        proposalId,
        totalAmount,
        totalPaid,
        remainingAmount,
        payments
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposal payment details',
      error: error.message
    });
  }
});

// POST /api/payments/process - Mock payment processing
// POST /api/payments/process
// Process a previously created payment
router.post('/process', (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and amount are required'
      });
    }

    const payment = dataStore.findById('payments', paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'SUCCESS') {
      return res.json({
        success: true,
        data: payment,
        message: 'Payment has already been processed'
      });
    }

    const paymentAmount = Number(amount);

    if (paymentAmount !== Number(payment.amount)) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match the created payment'
      });
    }

    // Update payment status to PROCESSING
    dataStore.update('payments', paymentId, {
      status: 'PROCESSING',
      currentStep: 'GATEWAY_PROCESSING',
      steps: [
        ...(payment.steps || []),
        {
          step: 'GATEWAY_PROCESSING',
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
          description: 'Payment gateway processing transaction'
        }
      ],
      updatedAt: new Date().toISOString()
    });

    // Simulate payment processing delay
    setTimeout(() => {
      try {
        const transactionReference = `TXN-${Date.now()}`;

        dataStore.update('payments', paymentId, {
          status: 'SUCCESS',
          currentStep: 'COMPLETED',
          transactionReference,
          paidAt: new Date().toISOString(),
          steps: [
            ...(dataStore.findById('payments', paymentId).steps || []),
            {
              step: 'GATEWAY_PROCESSING',
              status: 'COMPLETED',
              timestamp: new Date().toISOString(),
              description: 'Payment gateway processing completed'
            },
            {
              step: 'COMPLETED',
              status: 'COMPLETED',
              timestamp: new Date().toISOString(),
              description: 'Payment successfully completed'
            }
          ],
          updatedAt: new Date().toISOString()
        });

        const updatedPayment = dataStore.findById(
          'payments',
          paymentId
        );

        // Mark service request as engaged when payment is processed
        if (updatedPayment.proposalId) {
          const proposal = dataStore.findById('proposals', updatedPayment.proposalId);
          if (proposal && proposal.requestId) {
            const serviceRequest = dataStore.findById('serviceRequests', proposal.requestId);
            if (serviceRequest && serviceRequest.status !== 'ENGAGED') {
              dataStore.update(
                'serviceRequests',
                proposal.requestId,
                {
                  status: 'ENGAGED',
                  updatedAt: new Date().toISOString()
                }
              );
            }
          }
        }

        res.json({
          success: true,
          data: updatedPayment,
          message: 'Payment processed successfully',
          paymentStatus: 'COMPLETED',
          currentStep: 'COMPLETED'
        });

      } catch (error) {
        // Update payment status to FAILED
        dataStore.update('payments', paymentId, {
          status: 'FAILED',
          currentStep: 'GATEWAY_ERROR',
          steps: [
            ...(dataStore.findById('payments', paymentId).steps || []),
            {
              step: 'GATEWAY_ERROR',
              status: 'FAILED',
              timestamp: new Date().toISOString(),
              description: 'Payment gateway processing failed'
            }
          ],
          updatedAt: new Date().toISOString()
        });

        res.status(500).json({
          success: false,
          message: 'Error completing payment',
          error: error.message
        });
      }
    }, 1000);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

// POST /api/payments/webhook - Mock payment webhook
// POST /api/payments/webhook
// Confirm successful payment
router.post('/webhook', (req, res) => {
  try {
    const {
      paymentId,
      referenceId,
      amount,
      status
    } = req.body;

    if (
      !paymentId ||
      !referenceId ||
      amount === undefined ||
      amount === null ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required webhook fields'
      });
    }

    const payment = dataStore.findById('payments', paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Avoid processing the same payment twice
    if (
      payment.status === 'SUCCESS' &&
      payment.transactionReference === referenceId
    ) {
      return res.json({
        success: true,
        message: 'Payment webhook already processed',
        data: {
          paymentId,
          status: payment.status
        }
      });
    }

    if (status !== 'SUCCESS') {
      // Update payment status to FAILED with step tracking
      dataStore.update('payments', paymentId, {
        status: 'FAILED',
        currentStep: 'WEBHOOK_FAILED',
        steps: [
          ...(payment.steps || []),
          {
            step: 'WEBHOOK_RECEIVED',
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            description: 'Webhook received from payment gateway'
          },
          {
            step: 'WEBHOOK_FAILED',
            status: 'FAILED',
            timestamp: new Date().toISOString(),
            description: 'Payment failed according to webhook'
          }
        ],
        updatedAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: 'Webhook received - payment not successful',
        data: { paymentId, status: 'FAILED' }
      });
    }

    // --------------------------------------------------
    // 1. Update payment with step tracking
    // --------------------------------------------------

    dataStore.update('payments', paymentId, {
      status: 'SUCCESS',
      transactionReference: referenceId,
      currentStep: 'WEBHOOK_PROCESSED',
      paidAt: new Date().toISOString(),
      steps: [
        ...(payment.steps || []),
        {
          step: 'WEBHOOK_RECEIVED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Webhook received from payment gateway'
        },
        {
          step: 'WEBHOOK_PROCESSED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Webhook successfully processed'
        }
      ],
      updatedAt: new Date().toISOString()
    });

    const updatedPayment = dataStore.findById(
      'payments',
      paymentId
    );

    const proposal = dataStore.findById(
      'proposals',
      payment.proposalId
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // --------------------------------------------------
    // 2. Calculate total payment for this proposal
    // --------------------------------------------------

    const proposalPayments = dataStore.filter(
      'payments',
      p =>
        p.proposalId === proposal.proposalId &&
        p.status === 'SUCCESS'
    );

    const totalPaid = proposalPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const totalValue = Number(proposal.price || 0);

    const balanceDue = Math.max(
      totalValue - totalPaid,
      0
    );

    // --------------------------------------------------
    // 3. Check if engagement already exists
    // --------------------------------------------------

    const existingEngagements = dataStore.filter(
      'engagements',
      e => e.proposalId === proposal.proposalId
    );

    let engagement;

    if (existingEngagements.length > 0) {

      // ------------------------------------------------
      // Existing engagement
      // Update payment information only
      // ------------------------------------------------

      engagement = existingEngagements[0];

      const newStatus =
        balanceDue === 0
          ? 'COMPLETED'
          : engagement.status;

      dataStore.update(
        'engagements',
        engagement.engagementId,
        {
          totalPaid,
          balanceDue,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      );

      engagement = dataStore.findById(
        'engagements',
        engagement.engagementId
      );

      console.log(
        `Existing engagement ${engagement.engagementId} updated`
      );

    } else {

      // ------------------------------------------------
      // First successful payment
      // Create engagement
      // ------------------------------------------------

      const engagementId =
        dataStore.generateEngagementNumber();

      engagement = {
        id: engagementId,
        engagementId,

        requestId: proposal.requestId,
        proposalId: proposal.proposalId,

        clientId: 'CL-001',
        providerId: proposal.providerId,

        status: balanceDue === 0
          ? 'COMPLETED'
          : 'ACTIVE',

        totalValue,
        totalPaid,
        balanceDue,

        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),

        lineItems: []
      };

      dataStore.add(
        'engagements',
        engagement
      );

      // Link payment to engagement
      dataStore.update(
        'payments',
        paymentId,
        {
          engagementId
        }
      );

      // ------------------------------------------------
      // Create work order only once
      // ------------------------------------------------

      const serviceRequest = dataStore.findById(
        'serviceRequests',
        proposal.requestId
      );

      if (
        serviceRequest &&
        serviceRequest.lineItems
      ) {

        const workOrderId =
          dataStore.generateWorkOrderNumber();

        const workOrder = {
          id: workOrderId,
          workOrderId,

          orderNumber:
            dataStore.generateWorkOrderNumber(),

          engagementId,

          items: serviceRequest.lineItems.map(
            (item, index) => ({
              itemId: `WOI-${Date.now()}-${index}`,
              name: item.name,
              quantity: item.quantity,

              unitPrice: item.targetBudget,

              amount:
                item.quantity *
                item.targetBudget
            })
          ),

          totalValue:
            serviceRequest.lineItems.reduce(
              (sum, item) =>
                sum +
                item.quantity *
                item.targetBudget,
              0
            ),

          status: 'OPEN',

          createdAt:
            new Date().toISOString()
        };

        dataStore.add(
          'workOrders',
          workOrder
        );

        // Update engagement
        dataStore.update(
          'engagements',
          engagementId,
          {
            lineItems: workOrder.items
          }
        );
      }

      // Mark service request as engaged when any payment is made
      if (serviceRequest && serviceRequest.status !== 'ENGAGED') {
        dataStore.update(
          'serviceRequests',
          proposal.requestId,
          {
            status: 'ENGAGED',
            updatedAt: new Date().toISOString()
          }
        );
      }
    }

    // --------------------------------------------------
    // 4. Link payment to engagement
    // --------------------------------------------------

    dataStore.update(
      'payments',
      paymentId,
      {
        engagementId: engagement.engagementId
      }
    );

    // --------------------------------------------------
    // 5. Response
    // --------------------------------------------------

    res.json({
      success: true,
      message: 'Webhook processed successfully',

      data: {
        paymentId,
        paymentAmount: Number(payment.amount),
        totalPaid,
        totalValue,
        balanceDue,

        paymentStatus: 'SUCCESS',
        currentStep: 'WEBHOOK_PROCESSED',
        steps: dataStore.findById('payments', paymentId).steps,

        engagementId:
          engagement.engagementId,

        engagementStatus:
          balanceDue === 0
            ? 'COMPLETED'
            : 'ACTIVE'
      }
    });

  } catch (error) {

    console.error(
      'Webhook error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

// GET /api/engagements/:engagementId/payments - Get payment history for an engagement
router.get('/engagements/:engagementId', (req, res) => {
  try {
    const payments = dataStore.filter('payments', 
      p => p.engagementId === req.params.engagementId
    );
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
});

// POST /api/payments/engagement/:engagementId - Make a direct payment to engagement
router.post('/engagement/:engagementId', (req, res) => {
  try {
    const { amount, paymentType, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const engagement = dataStore.findById('engagements', req.params.engagementId);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found'
      });
    }

    // Calculate total paid so far
    const existingPayments = dataStore.filter('payments', 
      p => p.engagementId === req.params.engagementId && p.status === 'SUCCESS'
    );
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Validate payment doesn't exceed total value
    if (totalPaid + amount > engagement.totalValue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Remaining: ₹${engagement.totalValue - totalPaid}`
      });
    }

    // Create payment with step tracking
    const paymentId = dataStore.generatePaymentNumber();
    const payment = {
      id: paymentId,
      paymentId,
      engagementId: req.params.engagementId,
      billingStatementId: null, // Direct payment to engagement
      amount,
      paymentType: paymentType || 'ADVANCE_PAYMENT',
      paymentMethod: 'MOCK_GATEWAY',
      status: 'SUCCESS',
      currentStep: 'COMPLETED',
      transactionReference: `TXN-${Date.now()}`,
      description: description || 'Direct payment to engagement',
      steps: [
        {
          step: 'INITIATED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment request initiated'
        },
        {
          step: 'VALIDATION',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment validation completed'
        },
        {
          step: 'GATEWAY_PROCESSING',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment gateway processing completed'
        },
        {
          step: 'COMPLETED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment successfully completed'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dataStore.add('payments', payment);

    // Update engagement totals
    const newTotalPaid = totalPaid + amount;
    const newBalanceDue = engagement.totalValue - newTotalPaid;

    dataStore.update('engagements', req.params.engagementId, {
      totalPaid: newTotalPaid,
      balanceDue: newBalanceDue,
      updatedAt: new Date().toISOString()
    });

    // Mark service request as engaged when payment is made
    if (engagement.requestId) {
      const serviceRequest = dataStore.findById('serviceRequests', engagement.requestId);
      if (serviceRequest && serviceRequest.status !== 'ENGAGED') {
        dataStore.update(
          'serviceRequests',
          engagement.requestId,
          {
            status: 'ENGAGED',
            updatedAt: new Date().toISOString()
          }
        );
      }
    }

    res.status(201).json({
      success: true,
      data: payment,
      engagement: {
        totalPaid: newTotalPaid,
        balanceDue: newBalanceDue,
        totalValue: engagement.totalValue
      },
      message: 'Payment processed successfully',
      paymentStatus: 'COMPLETED',
      currentStep: 'COMPLETED'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

// POST /api/payments/billing/:statementId - Make a billing payment
router.post('/billing/:statementId', (req, res) => {
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

// GET /api/payments - Get all payments
router.get('/', (req, res) => {
  try {
    const payments = dataStore.get('payments');
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// POST /api/payments
// Create a partial payment for a proposal
router.post('/', (req, res) => {
  try {
    const { proposalId, amount } = req.body;

    if (!proposalId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Proposal ID and payment amount are required'
      });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    const proposal = dataStore.findById('proposals', proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    if (proposal.status !== 'ACCEPTED') {
      return res.status(409).json({
        success: false,
        message: 'Proposal must be accepted before making a payment'
      });
    }

    const totalAmount = Number(proposal.price || 0);

    const existingPayments = dataStore.filter(
      'payments',
      p => p.proposalId === proposalId && p.status === 'SUCCESS'
    );

    const totalPaid = existingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const remainingAmount = Math.max(totalAmount - totalPaid, 0);

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'The full project amount has already been paid'
      });
    }

    if (paymentAmount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Remaining: ₹${remainingAmount}`
      });
    }

    const paymentId = dataStore.generatePaymentNumber();

    const payment = {
      id: paymentId,
      paymentId,
      proposalId,
      amount: paymentAmount,

      paymentType:
        totalPaid === 0 ? 'ADVANCE_PAYMENT' : 'PARTIAL_PAYMENT',

      paymentMethod: 'MOCK_GATEWAY',
      status: 'PENDING',
      currentStep: 'PAYMENT_CREATED',
      steps: [
        {
          step: 'PAYMENT_CREATED',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: 'Payment record created in system'
        },
        {
          step: 'PENDING_PROCESSING',
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
          description: 'Waiting for payment processing'
        }
      ],

      transactionReference: null,

      createdAt: new Date().toISOString(),
      paidAt: null,
      updatedAt: new Date().toISOString()
    };

    dataStore.add('payments', payment);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Partial payment created successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating partial payment',
      error: error.message
    });
  }
});

// GET /api/payments/:paymentId/status - Get detailed payment status with step tracking
router.get('/:paymentId/status', (req, res) => {
  try {
    const payment = dataStore.findById('payments', req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Calculate payment progress
    const totalSteps = payment.steps?.length || 0;
    const completedSteps = payment.steps?.filter(step => step.status === 'COMPLETED').length || 0;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        status: payment.status,
        currentStep: payment.currentStep,
        steps: payment.steps || [],
        progress: {
          totalSteps,
          completedSteps,
          remainingSteps: totalSteps - completedSteps,
          percentage: progressPercentage
        },
        amount: payment.amount,
        paymentType: payment.paymentType,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: error.message
    });
  }
});

module.exports = router;