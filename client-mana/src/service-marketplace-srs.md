# Software Requirements Specification (SRS)

## Service Marketplace — Request to Engagement & Payment Management System

**Version:** 1.0  
**Frontend:** React.js  
**Backend:** Express.js / Node.js  
**Database:** LocalStorage  
**Payment:** Mock Payment Gateway / Simulated Webhook  
**Architecture:** REST API + React SPA

---

## 1. Introduction

### 1.1 Purpose

The purpose of this system is to implement an end-to-end service marketplace workflow where a **Client** creates a Service Request, a **Provider** submits a Proposal, and the Client accepts the Proposal and makes an upfront payment.

After successful payment, the system automatically converts the Service Request into an **Active Engagement**.

The Engagement becomes the central workspace where the system manages:

- Work Orders
- Billing Statements
- Payments
- Payment history
- Outstanding balances
- Engagement status

### 1.2 Core Workflow

```text
Service Request
      ↓
Proposal
      ↓
Proposal Accepted
      ↓
Upfront Payment
      ↓
Engagement
      ↓
Work Order
      ↓
Billing Statement
      ↓
Payment
      ↓
Payment Ledger / Balance
```

---

# 2. Scope

The application will support two primary user roles:

## 2.1 Client

The client can:

- Create Service Requests
- Add multiple line items
- View submitted proposals
- Accept a proposal
- Make the initial payment
- View active engagements
- View Work Orders
- View Billing Statements
- Make additional payments
- View payment history
- View total paid and balance due

## 2.2 Provider

The provider can:

- View available Service Requests
- Submit proposals
- Specify price, timeline, and terms
- View accepted engagements
- View Work Orders
- View Billing Statements
- View payment status

---

# 3. Technology Stack

## 3.1 Frontend

- React.js
- JavaScript / TypeScript
- React Router
- Context API / useReducer
- CSS / Material UI
- Fetch API / Axios

## 3.2 Backend

- Node.js
- Express.js
- REST APIs

## 3.3 Data Storage

For the MVP:

- Browser LocalStorage

> **Architecture note:** LocalStorage belongs to the browser, while Express.js runs on the server. For this assignment, the recommended approach is to keep business logic and REST APIs in Express and use LocalStorage for demo persistence/frontend state. A production system should use a proper database such as PostgreSQL or MongoDB.

## 3.4 Payment

- Mock Payment Gateway
- Simulated payment webhook

No real payment provider is required.

---

# 4. User Roles

| Permission | Client | Provider |
|---|---:|---:|
| Create Service Request | Yes | No |
| Add Line Items | Yes | No |
| View Service Requests | Yes | Yes |
| Submit Proposal | No | Yes |
| View Proposals | Yes | Yes |
| Accept Proposal | Yes | No |
| Make Initial Payment | Yes | No |
| View Engagement | Yes | Yes |
| View Work Order | Yes | Yes |
| Generate Billing Statement | No | Yes |
| Make Additional Payment | Yes | No |
| View Payment History | Yes | Yes |

---

# 5. Core Entities

The application contains the following entities:

```text
Client
Provider
ServiceRequest
RequestLineItem
Proposal
Engagement
WorkOrder
WorkOrderItem
BillingStatement
Payment
```

Entity relationship:

```text
Client
  │
  └── ServiceRequest
          │
          ├── RequestLineItem[]
          │
          └── Proposal
                 │
                 └── Payment
                        │
                        └── Engagement
                              │
                              └── WorkOrder
                                    │
                                    └── BillingStatement
                                          │
                                          └── Payment
```

---

# 6. Service Request

## 6.1 Description

A Service Request represents work that a client wants a provider to perform.

## 6.2 Fields

```text
requestId
clientId
title
description
status
createdAt
updatedAt
lineItems[]
```

## 6.3 Request Line Item

Each Service Request must contain one or more line items.

```text
lineItemId
name
quantity
targetBudget
expectedTimeline
```

## 6.4 Example

```json
{
  "requestId": "SR-1001",
  "clientId": "CL-001",
  "title": "E-Commerce Website",
  "description": "Need an online store for our business",
  "status": "OPEN",
  "lineItems": [
    {
      "lineItemId": "LI-001",
      "name": "Website Development",
      "quantity": 1,
      "targetBudget": 50000,
      "expectedTimeline": "30 days"
    },
    {
      "lineItemId": "LI-002",
      "name": "Payment Gateway",
      "quantity": 1,
      "targetBudget": 10000,
      "expectedTimeline": "7 days"
    }
  ]
}
```

---

# 7. Service Request Status

Supported statuses:

```text
DRAFT
OPEN
PROPOSAL_RECEIVED
PROPOSAL_ACCEPTED
PAYMENT_PENDING
COMPLETED
CANCELLED
```

## 7.1 Status Flow

```text
DRAFT
  ↓
OPEN
  ↓
PROPOSAL_RECEIVED
  ↓
PROPOSAL_ACCEPTED
  ↓
PAYMENT_PENDING
  ↓
COMPLETED
```

## 7.2 Status Transition Rules

| Current Status | Action | New Status |
|---|---|---|
| DRAFT | Client submits request | OPEN |
| OPEN | Provider submits proposal | PROPOSAL_RECEIVED |
| PROPOSAL_RECEIVED | Client accepts proposal | PROPOSAL_ACCEPTED |
| PROPOSAL_ACCEPTED | Payment initiated | PAYMENT_PENDING |
| PAYMENT_PENDING | Payment successful | COMPLETED |
| Applicable state | Client cancels | CANCELLED |

---

# 8. Proposal

A Proposal represents the provider's response to a Service Request.

## 8.1 Fields

```text
proposalId
requestId
providerId
price
timeline
terms
status
createdAt
updatedAt
```

## 8.2 Example

```json
{
  "proposalId": "PROP-1001",
  "requestId": "SR-1001",
  "providerId": "PR-001",
  "price": 55000,
  "timeline": "35 days",
  "terms": "50% upfront payment",
  "status": "SUBMITTED"
}
```

---

# 9. Proposal Status

Supported statuses:

```text
DRAFT
SUBMITTED
ACCEPTED
REJECTED
WITHDRAWN
```

## 9.1 Status Flow

```text
DRAFT
   ↓
SUBMITTED
   ↓
ACCEPTED
```

Alternative:

```text
SUBMITTED
   ↓
REJECTED
```

Once a proposal is accepted, it becomes **locked**.

The provider cannot modify:

- Price
- Timeline
- Terms
- Line items

---

# 10. Proposal Acceptance

When the client selects **Accept Proposal**:

### Step 1 — Accept Proposal

```text
SUBMITTED → ACCEPTED
```

### Step 2 — Update Service Request

```text
PROPOSAL_RECEIVED
        ↓
PROPOSAL_ACCEPTED
```

### Step 3 — Calculate Upfront Payment

For the MVP:

```text
Upfront Payment = Accepted Proposal Price
```

Alternatively, the system may support a configurable upfront percentage.

Example:

```text
Proposal Amount = ₹60,000
Upfront Percentage = 50%
Payment Required = ₹30,000
```

### Step 4 — Open Mock Payment Gateway

---

# 11. Mock Payment Gateway

The application should display a payment screen such as:

```text
Payment Amount: ₹30,000

[ Pay Now ]
```

After clicking **Pay Now**:

```text
Processing...
     ↓
Payment Successful
```

The backend receives a simulated webhook:

```http
POST /api/payments/webhook
```

Example payload:

```json
{
  "paymentId": "PAY-1001",
  "referenceId": "PROP-1001",
  "amount": 30000,
  "status": "SUCCESS"
}
```

---

# 12. Automatic Engagement Creation

After successful upfront payment:

```text
Payment SUCCESS
      ↓
Service Request = COMPLETED
      ↓
Create Engagement
```

The Engagement automatically contains:

```text
engagementId
requestId
proposalId
clientId
providerId
status
acceptedPrice
startDate
createdAt
lineItems[]
```

---

# 13. Engagement

The Engagement is the central workspace for the project.

## 13.1 Status

```text
ACTIVE
ON_HOLD
COMPLETED
CANCELLED
```

Initial status:

```text
ACTIVE
```

## 13.2 Example

```json
{
  "engagementId": "ENG-1001",
  "requestId": "SR-1001",
  "proposalId": "PROP-1001",
  "clientId": "CL-001",
  "providerId": "PR-001",
  "status": "ACTIVE",
  "totalValue": 60000,
  "totalPaid": 30000,
  "balanceDue": 30000,
  "lineItems": []
}
```

---

# 14. Dynamic Work Order Generation

When an Engagement becomes active, the system automatically creates a Work Order.

## 14.1 Work Order Fields

```text
workOrderId
orderNumber
engagementId
items[]
subtotal
totalValue
status
createdAt
```

## 14.2 Example

```json
{
  "workOrderId": "WO-1001",
  "orderNumber": "WO-2026-001",
  "engagementId": "ENG-1001",
  "items": [
    {
      "itemId": "WOI-001",
      "name": "Website Development",
      "quantity": 1,
      "unitPrice": 50000,
      "amount": 50000
    },
    {
      "itemId": "WOI-002",
      "name": "Payment Gateway",
      "quantity": 1,
      "unitPrice": 10000,
      "amount": 10000
    }
  ],
  "totalValue": 60000,
  "status": "OPEN"
}
```

---

# 15. Work Order Status

Supported statuses:

```text
DRAFT
OPEN
IN_PROGRESS
COMPLETED
CANCELLED
```

Flow:

```text
DRAFT
  ↓
OPEN
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

---

# 16. Work Order Locking Rules

## 16.1 Before Billing Statement

The Work Order can be edited.

```text
Work Order
    ↓
No Billing Statement
    ↓
Editable
```

## 16.2 After Billing Statement

Once a Billing Statement has been raised:

```text
Work Order
    ↓
Billing Statement exists
    ↓
LOCKED
```

The following fields cannot be changed:

- Quantity
- Unit Price
- Line Items
- Total Amount

If a correction is required, the system should use an adjustment/revised Work Order instead of silently modifying the original.

---

# 17. Billing Statement

A Billing Statement represents an amount requested from the client against a Work Order.

A Work Order can have multiple Billing Statements.

Example:

```text
Work Order = ₹60,000

Billing Statement 1 = ₹20,000
Billing Statement 2 = ₹15,000
Billing Statement 3 = ₹25,000
```

Total:

```text
₹60,000
```

---

# 18. Billing Statement Fields

```text
billingStatementId
statementNumber
engagementId
workOrderId
amount
status
dueDate
createdAt
paidAmount
balanceAmount
```

Example:

```json
{
  "billingStatementId": "BS-1001",
  "statementNumber": "BS-2026-001",
  "engagementId": "ENG-1001",
  "workOrderId": "WO-1001",
  "amount": 20000,
  "paidAmount": 0,
  "balanceAmount": 20000,
  "status": "PENDING"
}
```

---

# 19. Billing Statement Status

Supported statuses:

```text
DRAFT
PENDING
PARTIALLY_PAID
PAID
CANCELLED
```

Flow:

```text
DRAFT
  ↓
PENDING
  ↓
PARTIALLY_PAID
  ↓
PAID
```

If the full amount is paid directly:

```text
PENDING
  ↓
PAID
```

---

# 20. Partial Billing

The system must support milestone-based billing.

Example:

```text
Work Order Total = ₹100,000
```

Provider creates:

```text
Statement #1 = ₹25,000
Statement #2 = ₹25,000
Statement #3 = ₹30,000
Statement #4 = ₹20,000
```

Total:

```text
₹100,000
```

Business rule:

```text
Total Billing Statements ≤ Work Order Total
```

Invalid example:

```text
Work Order = ₹100,000
Existing Billing = ₹90,000
New Statement = ₹20,000
```

The system must reject the new statement because:

```text
₹90,000 + ₹20,000 > ₹100,000
```

---

# 21. Additional Payments

The client can make payments from the Engagement Dashboard.

Example:

```text
Billing Statement

Amount: ₹20,000
Paid: ₹5,000
Balance: ₹15,000

[Make Payment]
```

After a successful payment:

```text
Payment
   ↓
Billing Statement Updated
   ↓
Engagement Ledger Updated
```

---

# 22. Payment Entity

## 22.1 Fields

```text
paymentId
engagementId
billingStatementId
amount
paymentType
paymentMethod
status
transactionReference
createdAt
```

## 22.2 Example

```json
{
  "paymentId": "PAY-1002",
  "engagementId": "ENG-1001",
  "billingStatementId": "BS-1001",
  "amount": 10000,
  "paymentType": "BILLING_PAYMENT",
  "paymentMethod": "MOCK_GATEWAY",
  "status": "SUCCESS",
  "transactionReference": "TXN-783291",
  "createdAt": "2026-09-25T10:30:00Z"
}
```

---

# 23. Payment Types

Supported payment types:

```text
UPFRONT_PAYMENT
BILLING_PAYMENT
```

Example:

```text
Payment #1
Type = UPFRONT_PAYMENT
Amount = ₹30,000

Payment #2
Type = BILLING_PAYMENT
Amount = ₹10,000
```

---

# 24. Engagement Payment Ledger

The Engagement Dashboard should display:

```text
Total Engagement Value
Total Paid
Total Billed
Total Outstanding
```

Example:

```text
Engagement Value       ₹100,000
Upfront Payment         ₹30,000
Additional Payments     ₹25,000
--------------------------------
Total Paid              ₹55,000

Balance Due             ₹45,000
```

Formula:

```text
Balance Due =
Engagement Total Value - Total Successful Payments
```

Only successful payments should be included.

---

# 25. Payment History

The dashboard should display:

| Date | Payment ID | Type | Statement | Amount | Status |
|---|---|---|---|---:|---|
| 25 Sep | PAY-001 | Upfront | — | ₹30,000 | Success |
| 28 Sep | PAY-002 | Billing | BS-001 | ₹10,000 | Success |
| 30 Sep | PAY-003 | Billing | BS-001 | ₹10,000 | Success |

---

# 26. REST API Requirements

## 26.1 Service Request APIs

### Create Request

```http
POST /api/service-requests
```

### Get Requests

```http
GET /api/service-requests
```

### Get Request

```http
GET /api/service-requests/:id
```

### Update Request

```http
PUT /api/service-requests/:id
```

### Cancel Request

```http
PATCH /api/service-requests/:id/cancel
```

---

# 27. Proposal APIs

### Submit Proposal

```http
POST /api/proposals
```

### Get Proposals

```http
GET /api/service-requests/:requestId/proposals
```

### Accept Proposal

```http
POST /api/proposals/:proposalId/accept
```

The acceptance API should initiate the payment process.

---

# 28. Payment APIs

### Initial Payment

```http
POST /api/payments/upfront
```

### Mock Payment

```http
POST /api/payments/process
```

### Mock Webhook

```http
POST /api/payments/webhook
```

### Payment History

```http
GET /api/engagements/:engagementId/payments
```

---

# 29. Engagement APIs

### Get Engagements

```http
GET /api/engagements
```

### Get Engagement

```http
GET /api/engagements/:id
```

### Update Engagement

```http
PATCH /api/engagements/:id
```

---

# 30. Work Order APIs

### Get Work Orders

```http
GET /api/engagements/:engagementId/work-orders
```

### Generate Work Order

```http
POST /api/engagements/:engagementId/work-orders
```

### Update Work Order

```http
PUT /api/work-orders/:id
```

---

# 31. Billing APIs

### Generate Billing Statement

```http
POST /api/work-orders/:workOrderId/billing-statements
```

### Get Statements

```http
GET /api/work-orders/:workOrderId/billing-statements
```

### Get Engagement Statements

```http
GET /api/engagements/:engagementId/billing-statements
```

---

# 32. Additional Payment API

```http
POST /api/billing-statements/:statementId/payments
```

Request:

```json
{
  "amount": 10000
}
```

The API must validate:

```text
amount > 0
amount <= statement.balanceAmount
```

---

# 33. Frontend Pages

The React application should contain the following pages:

```text
Dashboard
Create Service Request
Service Request Details
Payment Page
Engagement List
Engagement Details
```

---

# 34. Dashboard

Route:

```text
/
```

Display:

```text
Active Requests
Pending Proposals
Active Engagements
Pending Payments
```

---

# 35. Create Service Request Page

Route:

```text
/service-requests/create
```

Form:

```text
Request Title
Description

Line Items

--------------------------------
Task / Deliverable
Quantity
Target Budget
Expected Timeline
--------------------------------

[+ Add Line Item]

[Save Draft]
[Submit Request]
```

---

# 36. Service Request Details

Route:

```text
/service-requests/:id
```

Display:

```text
Request Information

Status: PROPOSAL_RECEIVED

Line Items

Proposal(s)

Provider
Price
Timeline
Terms

[Accept Proposal]
```

---

# 37. Payment Page

After accepting a proposal:

```text
Payment Required

Proposal Amount: ₹60,000
Upfront Payment: ₹30,000

[ Pay ₹30,000 ]
```

After payment:

```text
✓ Payment Successful

Engagement created successfully.
```

Then redirect to:

```text
/engagements/:id
```

---

# 38. Engagement Dashboard

The Engagement Dashboard is the main workspace.

Example:

```text
------------------------------------------------
                ENGAGEMENT
------------------------------------------------

E-Commerce Website

Client: ABC Company
Provider: XYZ Technologies

Status: ACTIVE

------------------------------------------------
Financial Summary
------------------------------------------------

Total Value       ₹60,000
Total Paid        ₹30,000
Total Billed      ₹20,000
Balance Due       ₹30,000

------------------------------------------------
Work Order
------------------------------------------------

WO-2026-001

Website Development       ₹50,000
Payment Gateway            ₹10,000

Total                      ₹60,000

------------------------------------------------
Billing Statements
------------------------------------------------

BS-2026-001
Amount: ₹20,000
Paid: ₹10,000
Balance: ₹10,000

[Make Payment]

------------------------------------------------
Payment History
------------------------------------------------

PAY-001   Upfront       ₹30,000   Success
PAY-002   BS-001        ₹10,000   Success
```

---

# 39. LocalStorage Data Structure

Recommended LocalStorage keys:

```text
serviceRequests
proposals
engagements
workOrders
billingStatements
payments
users
```

Example:

```javascript
localStorage.setItem(
  "serviceRequests",
  JSON.stringify(serviceRequests)
);
```

Retrieval:

```javascript
const requests = JSON.parse(
  localStorage.getItem("serviceRequests") || "[]"
);
```

---

# 40. Recommended ID Format

Use readable IDs:

```text
SR-1001       Service Request
PROP-1001     Proposal
ENG-1001      Engagement
WO-1001       Work Order
BS-1001       Billing Statement
PAY-1001      Payment
```

---

# 41. Important Business Rules

## Rule 1 — Proposal Acceptance

Only one proposal can be accepted for a Service Request.

```text
One Request
     ↓
Multiple Proposals
     ↓
One Accepted Proposal
```

After acceptance:

```text
Other Proposals → REJECTED
```

## Rule 2 — Proposal Lock

After acceptance:

```text
Proposal = LOCKED
```

The provider cannot modify it.

## Rule 3 — Service Request Lock

After proposal acceptance:

```text
Service Request = LOCKED
```

The client cannot change:

- Line Items
- Quantity
- Budget
- Timeline

## Rule 4 — Engagement Creation

An Engagement can only be created when:

```text
Proposal = ACCEPTED
AND
Upfront Payment = SUCCESS
```

## Rule 5 — Work Order Creation

An active Engagement must have a Work Order.

```text
Engagement ACTIVE
       ↓
Work Order Generated
```

## Rule 6 — Billing Limit

Total billing cannot exceed the Work Order value.

```text
Total Billing ≤ Work Order Total
```

## Rule 7 — Payment Limit

A payment cannot exceed the outstanding amount of a Billing Statement.

```text
Payment Amount ≤ Statement Balance
```

## Rule 8 — Work Order Lock

Before billing:

```text
Editable
```

After billing:

```text
LOCKED
```

## Rule 9 — Billing Statement Lock

Once a payment has been made against a Billing Statement:

```text
Billing Statement = LOCKED
```

Its original amount cannot be changed.

## Rule 10 — Payment Immutability

Successful payments should never be edited or deleted.

If a payment needs correction, create a separate adjustment/refund transaction.

---

# 42. Complete Status Flow

```text
                   ┌──────────────┐
                   │    DRAFT     │
                   └──────┬───────┘
                          │ Submit
                          ▼
                   ┌──────────────┐
                   │     OPEN     │
                   └──────┬───────┘
                          │ Proposal
                          ▼
              ┌────────────────────────┐
              │ PROPOSAL_RECEIVED      │
              └───────────┬────────────┘
                          │ Accept
                          ▼
              ┌────────────────────────┐
              │ PROPOSAL_ACCEPTED      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   PAYMENT_PENDING      │
              └───────────┬────────────┘
                          │ Payment Success
                          ▼
              ┌────────────────────────┐
              │ REQUEST COMPLETED      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   ENGAGEMENT ACTIVE    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │     WORK ORDER         │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ BILLING STATEMENT      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │        PAYMENT         │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   PAYMENT LEDGER       │
              └────────────────────────┘
```

---

# 43. Error Handling

The backend should use standard HTTP responses.

## Success

```http
200 OK
201 CREATED
```

## Client Errors

```http
400 BAD REQUEST
404 NOT FOUND
409 CONFLICT
```

## Server Error

```http
500 INTERNAL SERVER ERROR
```

Example:

```json
{
  "success": false,
  "message": "Billing amount exceeds the remaining Work Order balance."
}
```

---

# 44. Validation Requirements

## Service Request

```text
Title → Required
Description → Required
Line Items → At least 1
Quantity → > 0
Target Budget → >= 0
Timeline → Required
```

## Proposal

```text
Price → > 0
Timeline → Required
Terms → Required
```

## Billing Statement

```text
Amount > 0
Amount <= Remaining Work Order Amount
```

## Payment

```text
Amount > 0
Amount <= Billing Statement Balance
```

---

# 45. Non-Functional Requirements

## 45.1 Performance

The UI should respond to normal user actions within approximately 1–2 seconds in the local development environment.

## 45.2 Usability

The application should provide:

- Clear navigation
- Simple forms
- Status badges
- Payment confirmation
- Error messages
- Loading states
- Responsive layout

## 45.3 Data Integrity

The application must prevent:

- Duplicate accepted proposals
- Overbilling
- Overpayment
- Modification of locked documents
- Engagement creation without successful payment

## 45.4 Security

For the MVP:

- Validate all API inputs.
- Do not trust frontend calculations.
- Validate payment amounts on the backend.
- Do not store sensitive payment information.

A production system should additionally implement:

- Authentication
- Authorization
- HTTPS
- Secure payment integration
- Database transactions
- Audit logs
- Server-side persistence

---

# 46. Recommended React Project Structure

```text
src/
│
├── components/
│   ├── Navbar.jsx
│   ├── StatusBadge.jsx
│   ├── LineItemForm.jsx
│   ├── ProposalCard.jsx
│   ├── PaymentModal.jsx
│   ├── WorkOrderCard.jsx
│   ├── BillingStatementCard.jsx
│   └── PaymentHistory.jsx
│
├── pages/
│   ├── Dashboard.jsx
│   ├── CreateRequest.jsx
│   ├── RequestDetails.jsx
│   ├── PaymentPage.jsx
│   ├── EngagementList.jsx
│   └── EngagementDetails.jsx
│
├── services/
│   ├── requestService.js
│   ├── proposalService.js
│   ├── engagementService.js
│   ├── paymentService.js
│   └── api.js
│
├── context/
│   └── AppContext.jsx
│
├── utils/
│   ├── storage.js
│   ├── calculations.js
│   └── idGenerator.js
│
└── App.jsx
```

---

# 47. Recommended Express Project Structure

```text
server/
│
├── controllers/
│   ├── requestController.js
│   ├── proposalController.js
│   ├── engagementController.js
│   ├── workOrderController.js
│   ├── billingController.js
│   └── paymentController.js
│
├── routes/
│   ├── requestRoutes.js
│   ├── proposalRoutes.js
│   ├── engagementRoutes.js
│   ├── workOrderRoutes.js
│   ├── billingRoutes.js
│   └── paymentRoutes.js
│
├── services/
│   ├── engagementService.js
│   ├── paymentService.js
│   └── documentService.js
│
├── data/
│   └── store.js
│
├── middleware/
│   └── errorHandler.js
│
└── server.js
```

---

# 48. MVP Acceptance Criteria

The project is considered complete when the following scenario works end-to-end.

## Step 1 — Client Creates Request

```text
Service Request
2 Line Items
Status = OPEN
```

## Step 2 — Provider Submits Proposal

```text
Price = ₹60,000
Timeline = 30 days
Status = SUBMITTED
```

## Step 3 — Client Accepts Proposal

```text
Proposal = ACCEPTED
Request = PAYMENT_PENDING
```

## Step 4 — Client Pays Upfront

```text
Payment = SUCCESS
```

## Step 5 — System Creates Engagement

```text
Engagement = ACTIVE
```

## Step 6 — System Generates Work Order

```text
WO-1001
Total = ₹60,000
```

## Step 7 — Billing Statement Is Generated

```text
BS-1001
Amount = ₹20,000
```

## Step 8 — Client Makes Payment

```text
Payment = ₹10,000
Status = SUCCESS
```

## Step 9 — Billing Statement Updates

```text
Amount = ₹20,000
Paid = ₹10,000
Balance = ₹10,000

Status = PARTIALLY_PAID
```

## Step 10 — Engagement Updates

```text
Total Value = ₹60,000
Total Paid = ₹40,000
Balance Due = ₹20,000
```

## Step 11 — Dashboard Displays

```text
Work Order
Billing Statements
Payment History
Total Paid
Balance Due
```

---

# 49. Recommended Development Order

Build the application in the following sequence:

```text
Phase 1
Data Models
      ↓
Phase 2
Express REST APIs
      ↓
Phase 3
Service Request
      ↓
Phase 4
Proposal
      ↓
Phase 5
Mock Payment
      ↓
Phase 6
Engagement Creation
      ↓
Phase 7
Work Order
      ↓
Phase 8
Billing Statement
      ↓
Phase 9
Additional Payments
      ↓
Phase 10
Payment Ledger
      ↓
Phase 11
React Dashboard
      ↓
Phase 12
Validation + Error Handling
```

---

# 50. Final End-to-End Business Flow

```text
CLIENT
  │
  │ Create Service Request
  ▼
SERVICE REQUEST
  │
  │ Provider submits proposal
  ▼
PROPOSAL
  │
  │ Client accepts
  ▼
PAYMENT PENDING
  │
  │ Mock payment succeeds
  ▼
ENGAGEMENT CREATED
  │
  ├──────────────► WORK ORDER
  │                     │
  │                     │ Partial billing
  │                     ▼
  │               BILLING STATEMENT
  │                     │
  │                     │ Client pays
  │                     ▼
  │                   PAYMENT
  │                     │
  └─────────────────────┘
             │
             ▼
       PAYMENT LEDGER
             │
             ├── Total Value
             ├── Total Paid
             └── Balance Due
```

---

# 51. Future Enhancements

The following features are outside the MVP but can be added later:

- User authentication
- JWT authorization
- PostgreSQL / MongoDB
- Real payment gateway
- Email notifications
- WhatsApp/SMS notifications
- Invoice PDF generation
- File attachments
- Provider ratings
- Client ratings
- Dispute management
- Refund management
- Audit logs
- Admin dashboard
- Multiple Work Orders per Engagement
- Multiple providers
- Tax/GST calculation
- Currency support
- Payment gateway webhook verification

---

## 52. MVP Definition

The minimum viable version must demonstrate:

1. Client creates a Service Request.
2. Request supports multiple line items.
3. Provider submits a Proposal.
4. Client accepts the Proposal.
5. Client completes a mocked upfront payment.
6. Successful payment automatically creates an Engagement.
7. Work Order is automatically generated.
8. Billing Statement can be generated for a partial amount.
9. Client can make additional payments.
10. Payment history is maintained.
11. Engagement displays total value, total paid, and balance due.
12. Status transitions are enforced.
13. Locked documents cannot be modified.
14. Overbilling and overpayment are prevented.
15. All major operations are exposed through Express REST APIs.
