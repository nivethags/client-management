import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import CreateServiceRequest from './pages/CreateServiceRequest';
import ServiceRequestDetails from './pages/ServiceRequestDetails';
import ProposalSubmission from './pages/ProposalSubmission';
import PaymentPage from './pages/PaymentPage';
import EngagementList from './pages/EngagementList';
import EngagementDetails from './pages/EngagementDetails';
import RoleSelector from './components/RoleSelector';
import { RoleProvider } from './context/RoleContext';

function App() {
  return (
    <RoleProvider>
      <Router>
        <div className="App">
          <RoleSelector />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/service-requests/create" element={<CreateServiceRequest />} />
            <Route path="/service-requests/:id" element={<ServiceRequestDetails />} />
            <Route path="/proposals/submit/:requestId" element={<ProposalSubmission />} />
            <Route path="/payment/:proposalId" element={<PaymentPage />} />
            <Route path="/engagements" element={<EngagementList />} />
            <Route path="/engagements/:id" element={<EngagementDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;