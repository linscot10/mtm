import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('userData'));
      setCurrentUser(userData);
    }
    setLoading(false);
  }, [token]);

  // const login = async (email, password) => {
  //   try {
  //     const response = await authService.login(email, password);
  //     const { token, role } = response.data;
      
  //     localStorage.setItem('token', token);
  //     localStorage.setItem('userData', JSON.stringify({ role, email }));
  //     setToken(token);
  //     setCurrentUser({ role, email });
      
  //     return { success: true };
  //   } catch (error) {
  //     return { 
  //       success: false, 
  //       message: error.response?.data?.msg || 'Login failed' 
  //     };
  //   }
  // };


const login = async (email, password) => {
  try {
    const response = await authService.login(email, password);
    const { token, role, userId, hasCompleteProfile } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify({ role, email, userId, hasCompleteProfile }));
    setToken(token);
    setCurrentUser({ role, email, userId, hasCompleteProfile });
    
    return { success: true, hasCompleteProfile };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.msg || 'Login failed' 
    };
  }
};
  // const register = async (userData) => {
  //   try {
  //     await authService.register(userData);
  //     return { success: true };
  //   } catch (error) {
  //     return { 
  //       success: false, 
  //       message: error.response?.data?.msg || 'Registration failed' 
  //     };
  //   }
  // };

 
// const register = async (userData) => {
//   try {

//     const response = await authService.registerWithPatient(userData);
//     return { success: true };
//   } catch (error) {
//     return { 
//       success: false, 
//       message: error.response?.data?.error || 'Registration failed' 
//     };
//   }
// };

const register = async (userData) => {
  try {
    // Use the correct endpoint for registration with patient data
    const response = await authService.registerWithPatient(userData);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.error || error.response?.data?.msg || 'Registration failed' 
    };
  }
};
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};