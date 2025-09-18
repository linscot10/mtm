import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      textAlign: 'center'
    }}>
      <h1>401 - Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/dashboard" style={{ marginTop: '20px' }}>
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;