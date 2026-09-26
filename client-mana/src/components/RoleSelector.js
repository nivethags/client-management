import React from 'react';
import { useRole } from '../context/RoleContext';

const RoleSelector = () => {
  const { currentRole, switchRole, isClient, isProvider } = useRole();

  return (
    <div className="role-selector">
      <div className="role-indicator">
        <span className="role-label">Current Role:</span>
        <span className={`role-badge ${currentRole.toLowerCase()}`}>
          {currentRole}
        </span>
      </div>
      <div className="role-buttons">
        <button
          className={`role-btn ${isClient ? 'active' : ''}`}
          onClick={() => switchRole('CLIENT')}
        >
          Client View
        </button>
        <button
          className={`role-btn ${isProvider ? 'active' : ''}`}
          onClick={() => switchRole('PROVIDER')}
        >
          Provider View
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;