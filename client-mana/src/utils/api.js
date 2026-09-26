import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service Request APIs
export const serviceRequestAPI = {
  getAll: () => api.get('/service-requests'),
  getById: (id) => api.get(`/service-requests/${id}`),
  create: (data) => api.post('/service-requests', data),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
  cancel: (id) => api.patch(`/service-requests/${id}/cancel`),
  getProposals: (requestId) => api.get(`/service-requests/${requestId}/proposals`),
  updateStatus: (id, status) =>
  api.patch(`/service-requests/${id}/status`, { status }),
};

// Proposal APIs
export const proposalAPI = {
  getAll: () => api.get('/proposals'),
  getById: (id) => api.get(`/proposals/${id}`),
  create: (data) => api.post('/proposals', data),
  accept: (id) => api.post(`/proposals/${id}/accept`),
};

// Payment APIs
// Payment APIs
export const paymentAPI = {
  // Get all payments
  getAll: () => api.get('/payments'),

  // Get payment details/history for a proposal
  getByProposalId: (proposalId) =>
    api.get(`/payments/proposal/${proposalId}`),

  // Create a new partial payment
  createPayment: (data) =>
    api.post('/payments', data),

  // Process payment through mock payment gateway
  processPayment: (data) =>
    api.post('/payments/process', data),

  // Confirm payment through webhook
  webhook: (data) =>
    api.post('/payments/webhook', data),

  // Existing engagement payment APIs
  getEngagementPayments: (engagementId) =>
    api.get(`/payments/engagements/${engagementId}`),

  processBillingPayment: (statementId, data) =>
    api.post(`/payments/billing/${statementId}`, data),

  processEngagementPayment: (engagementId, data) =>
    api.post(`/payments/engagement/${engagementId}`, data),

  // Get detailed payment status with step tracking
  getPaymentStatus: (paymentId) =>
    api.get(`/payments/${paymentId}/status`),
};

// Engagement APIs
export const engagementAPI = {
  getAll: () => api.get('/engagements'),
  getById: (id) => api.get(`/engagements/${id}`),
  update: (id, data) => api.patch(`/engagements/${id}`, data),
  getBillingStatements: (engagementId) => api.get(`/engagements/${engagementId}/billing-statements`),
};

// Work Order APIs
export const workOrderAPI = {
  getAll: () => api.get('/work-orders'),
  getById: (id) => api.get(`/work-orders/${id}`),
  getByEngagement: (engagementId) => api.get(`/work-orders/engagements/${engagementId}`),
  create: (engagementId, data) => api.post(`/work-orders/engagements/${engagementId}`, data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
};

// Billing Statement APIs
export const billingAPI = {
  getAll: () => api.get('/billing-statements'),
  getById: (id) => api.get(`/billing-statements/${id}`),
  getByWorkOrder: (workOrderId) => api.get(`/billing-statements/work-orders/${workOrderId}`),
  create: (workOrderId, data) => api.post(`/billing-statements/work-orders/${workOrderId}`, data),
  makePayment: (statementId, data) => api.post(`/billing-statements/${statementId}/payments`, data),
};

export default api;