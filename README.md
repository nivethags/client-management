# Client Management System

A full-stack client management and service marketplace application built with **React.js** and **Express.js**.

The application allows clients to create service requests, providers to submit proposals, and clients to accept proposals and manage engagements, work orders, and billing statements.

## 🚀 Features

### Client

- Create service requests
- View submitted service requests
- View provider proposals
- Accept proposals
- Manage active engagements
- View work orders
- View billing statements
- Track service request and engagement status

### Provider

- View available service requests
- Submit proposals
- Manage submitted proposals
- Track accepted proposals
- Manage active engagements
- Create and manage work orders
- Manage billing information

### Dashboard

- Overview of service requests
- Proposal management
- Engagement tracking
- Work order management
- Billing statement management
- Role-based navigation

## 🛠️ Tech Stack

### Frontend

- React.js
- React Router
- JavaScript
- Axios
- Context API
- CSS

### Backend

- Node.js
- Express.js
- REST APIs

### Data Storage

- LocalStorage
- In-memory backend data

### Development Tools

- Git
- GitHub
- npm
- VS Code
- Postman

## 📁 Project Structure

```text
client-management/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md