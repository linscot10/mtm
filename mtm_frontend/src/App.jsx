import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CompleteProfile from './components/patients/CompleteProfile';
import Dashboard from './components/dashboard/Dashboard';
import PatientManagement from './components/patients/PatientManagement';
import MedicalRecords from './components/medical-records/MedicalRecords';
import LabResults from './components/lab-results/LabResults';
import Prescriptions from './components/prescriptions/Prescriptions';
import VitalsManagement from './components/vitals/VitalsManagement';
import AppointmentManagement from './components/appointments/AppointmentManagement';
import Unauthorized from './components/common/Unauthorized';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();
  
  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/complete-profile" 
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {currentUser?.role === 'patient' && !currentUser?.hasCompleteProfile ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <Dashboard />
              )}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute allowedRoles={['nurse', 'doctor']}>
              <PatientManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/medical-records" 
          element={
            <ProtectedRoute allowedRoles={['doctor', 'nurse']}>
              <MedicalRecords />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lab-results" 
          element={
            <ProtectedRoute allowedRoles={['lab', 'doctor']}>
              <LabResults />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prescriptions" 
          element={
            <ProtectedRoute allowedRoles={['pharmacist', 'doctor']}>
              <Prescriptions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vitals" 
          element={
            <ProtectedRoute allowedRoles={['nurse', 'doctor']}>
              <VitalsManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute allowedRoles={['doctor', 'nurse', 'patient']}>
              <AppointmentManagement />
            </ProtectedRoute>
          } 
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;