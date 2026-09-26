// LocalStorage-like data store for the server
// Since we're using Express.js, we'll use an in-memory store that mimics LocalStorage
class DataStore {
  constructor() {
    this.data = {
      serviceRequests: [],
      proposals: [],
      engagements: [],
      workOrders: [],
      billingStatements: [],
      payments: [],
      users: [
        { id: 'CL-001', name: 'Client User', role: 'CLIENT' },
        { id: 'PR-001', name: 'Provider User', role: 'PROVIDER' }
      ]
    };
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample data will be added when needed
  }

  // Generic methods
  get(key) {
    return this.data[key] || [];
  }

  set(key, value) {
    this.data[key] = value;
  }

  add(key, item) {
    if (!this.data[key]) {
      this.data[key] = [];
    }
    this.data[key].push(item);
    return item;
  }

  update(key, id, updates) {
    const index = this.data[key].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[key][index] = { ...this.data[key][index], ...updates };
      return this.data[key][index];
    }
    return null;
  }

  delete(key, id) {
    const index = this.data[key].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[key].splice(index, 1);
      return true;
    }
    return false;
  }

  findById(key, id) {
    return this.data[key].find(item => item.id === id);
  }

  find(key, predicate) {
    return this.data[key].find(predicate);
  }

  filter(key, predicate) {
    return this.data[key].filter(predicate);
  }

  // ID generation helpers
  generateId(prefix) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}${random}`;
  }

  generateRequestNumber() {
    const count = this.data.serviceRequests.length + 1;
    return `SR-${1000 + count}`;
  }

  generateProposalNumber() {
    const count = this.data.proposals.length + 1;
    return `PROP-${1000 + count}`;
  }

  generateEngagementNumber() {
    const count = this.data.engagements.length + 1;
    return `ENG-${1000 + count}`;
  }

  generateWorkOrderNumber() {
    const count = this.data.workOrders.length + 1;
    return `WO-2026-${String(count).padStart(3, '0')}`;
  }

  generateBillingStatementNumber() {
    const count = this.data.billingStatements.length + 1;
    return `BS-2026-${String(count).padStart(3, '0')}`;
  }

  generatePaymentNumber() {
    const count = this.data.payments.length + 1;
    return `PAY-${1000 + count}`;
  }
}

// Create singleton instance
const dataStore = new DataStore();

module.exports = dataStore;