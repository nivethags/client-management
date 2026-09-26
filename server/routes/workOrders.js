const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');

// GET /api/work-orders - Get all work orders
router.get('/', (req, res) => {
  try {
    const workOrders = dataStore.get('workOrders');
    res.json({
      success: true,
      data: workOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work orders',
      error: error.message
    });
  }
});

// GET /api/engagements/:engagementId/work-orders - Get work orders for an engagement
router.get('/engagements/:engagementId', (req, res) => {
  try {
    const workOrders = dataStore.filter('workOrders', 
      wo => wo.engagementId === req.params.engagementId
    );
    res.json({
      success: true,
      data: workOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work orders',
      error: error.message
    });
  }
});

// GET /api/work-orders/:id - Get a specific work order
router.get('/:id', (req, res) => {
  try {
    const workOrder = dataStore.findById('workOrders', req.params.id);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Check if work order is locked (has billing statements)
    const billingStatements = dataStore.filter('billingStatements', 
      bs => bs.workOrderId === req.params.id
    );
    const isLocked = billingStatements.length > 0;

    res.json({
      success: true,
      data: {
        ...workOrder,
        isLocked,
        billingStatements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work order',
      error: error.message
    });
  }
});

// POST /api/engagements/:engagementId/work-orders - Generate a new work order
router.post('/engagements/:engagementId', (req, res) => {
  try {
    const { items } = req.body;

    const engagement = dataStore.findById('engagements', req.params.engagementId);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'All item fields are required'
        });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      if (item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Unit price cannot be negative'
        });
      }
    }

    const workOrderId = dataStore.generateWorkOrderNumber();
    const workOrder = {
      id: workOrderId,
      workOrderId,
      orderNumber: dataStore.generateWorkOrderNumber(),
      engagementId: req.params.engagementId,
      items: items.map((item, index) => ({
        itemId: `WOI-${Date.now()}-${index}`,
        ...item,
        amount: item.quantity * item.unitPrice
      })),
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    dataStore.add('workOrders', workOrder);

    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Work order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating work order',
      error: error.message
    });
  }
});

// PUT /api/work-orders/:id - Update a work order
router.put('/:id', (req, res) => {
  try {
    const { items, status } = req.body;

    const existingWorkOrder = dataStore.findById('workOrders', req.params.id);
    if (!existingWorkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Check if work order is locked
    const billingStatements = dataStore.filter('billingStatements', 
      bs => bs.workOrderId === req.params.id
    );
    if (billingStatements.length > 0 && items) {
      return res.status(409).json({
        success: false,
        message: 'Cannot modify a locked work order'
      });
    }

    const updates = {};
    if (items) {
      updates.items = items.map((item, index) => ({
        itemId: item.itemId || `WOI-${Date.now()}-${index}`,
        ...item,
        amount: item.quantity * item.unitPrice
      }));
      updates.totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    if (status) {
      const validStatuses = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
      updates.status = status;
    }

    const updatedWorkOrder = dataStore.update('workOrders', req.params.id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: updatedWorkOrder,
      message: 'Work order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating work order',
      error: error.message
    });
  }
});

module.exports = router;