const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const serviceRequestRoutes = require('./routes/serviceRequests');
const proposalRoutes = require('./routes/proposals');
const paymentRoutes = require('./routes/payments');
const engagementRoutes = require('./routes/engagements');
const workOrderRoutes = require('./routes/workOrders');
const billingRoutes = require('./routes/billingStatements');

// Use routes
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/service-requests/:requestId/proposals', proposalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/engagements', engagementRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/billing-statements', billingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Service Marketplace API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});