import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('CLIENT'); // Default to CLIENT

  const switchRole = (role) => {
    setCurrentRole(role);
  };

  const isClient = currentRole === 'CLIENT';
  const isProvider = currentRole === 'PROVIDER';

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, isClient, isProvider }}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleContext;