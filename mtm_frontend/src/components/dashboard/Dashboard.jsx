import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats(currentUser.role);
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch(currentUser.role) {
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      case 'lab': return '🔬';
      case 'pharmacist': return '💊';
      case 'patient': return '👤';
      default: return '👥';
    }
  };

  const getQuickActions = () => {
    const actions = {
      doctor: [
        { icon: '👥', label: 'View Patients', path: '/patients' },
        { icon: '📋', label: 'Medical Records', path: '/medical-records' },
        { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
        { icon: '📅', label: 'Appointments', path: '/appointments' }
      ],
      nurse: [
        { icon: '👥', label: 'Patient List', path: '/patients' },
        { icon: '❤️', label: 'Vital Signs', path: '/vitals' },
        { icon: '📋', label: 'Records', path: '/medical-records' },
        { icon: '📅', label: 'Schedule', path: '/appointments' }
      ],
      lab: [
        { icon: '🧪', label: 'Lab Tests', path: '/lab-tests' },
        { icon: '🔬', label: 'Results', path: '/results' },
        { icon: '📊', label: 'Reports', path: '/reports' }
      ],
      pharmacist: [
        { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
        { icon: '📦', label: 'Inventory', path: '/inventory' },
        { icon: '📋', label: 'Dispense', path: '/dispense' }
      ],
      patient: [
        { icon: '📋', label: 'My Records', path: '/medical-records' },
        { icon: '📅', label: 'Appointments', path: '/appointments' },
        { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
        { icon: '🔬', label: 'Lab Results', path: '/lab-results' }
      ]
    };
    
    return actions[currentUser.role] || [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-alert">
          {error}
        </div>
      </Layout>
    );
  }

  const getDashboardContent = () => {
    if (!dashboardData) return null;

    const roleClass = `${currentUser.role}-dashboard`;

    return (
      <div className={`dashboard-content ${roleClass}`}>
        <div className="dashboard-header">
          <h1>
            {getRoleIcon()} {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard
          </h1>
          <p>Welcome back, {currentUser.name}! Here's your overview.</p>
        </div>

        <div className="stats-grid">
          {getStatsCards()}
        </div>

        {getQuickActions().length > 0 && (
          <div className="quick-actions">
            <h3>⚡ Quick Actions</h3>
            <div className="action-grid">
              {getQuickActions().map((action, index) => (
                <a key={index} href={action.path} className="action-button">
                  <div className="action-icon">{action.icon}</div>
                  <span>{action.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatsCards = () => {
    const statsConfig = {
      doctor: [
        { key: 'patientsToday', label: 'Patients Today', icon: '👥' },
        { key: 'pendingRecords', label: 'Pending Records', icon: '📋' },
        { key: 'todayAppointments', label: 'Appointments', icon: '📅' },
        { key: 'totalPatients', label: 'Total Patients', icon: '👥' }
      ],
      nurse: [
        { key: 'newPatients', label: 'New Patients', icon: '🆕' },
        { key: 'vitalsToCheck', label: 'Vitals to Check', icon: '❤️' },
        { key: 'patientsToday', label: 'Patients Today', icon: '👥' },
        { key: 'totalPatients', label: 'Total Patients', icon: '👥' }
      ],
      lab: [
        { key: 'pendingTests', label: 'Pending Tests', icon: '⏳' },
        { key: 'completedTestsToday', label: 'Completed Today', icon: '✅' },
        { key: 'totalTestsThisWeek', label: 'Total This Week', icon: '📊' }
      ],
      pharmacist: [
        { key: 'pendingPrescriptions', label: 'Pending Prescriptions', icon: '⏳' },
        { key: 'dispensedToday', label: 'Dispensed Today', icon: '✅' },
        { key: 'totalPrescriptionsThisWeek', label: 'Total This Week', icon: '📊' }
      ],
      patient: [
        { key: 'medicalRecordsCount', label: 'Medical Records', icon: '📋' },
        { key: 'upcomingAppointments', label: 'Upcoming Appointments', icon: '📅' },
        { key: 'labResultsCount', label: 'Lab Results', icon: '🔬' },
        { key: 'prescriptionsCount', label: 'Prescriptions', icon: '💊' }
      ]
    };

    const cards = statsConfig[currentUser.role] || [];
    
    return cards.map((card, index) => (
      <div key={index} className="stat-card">
        <h3>
          <span>{card.icon}</span>
          {card.label}
        </h3>
        <p className="stat-number">{dashboardData[card.key] || 0}</p>
        {dashboardData[`${card.key}Trend`] && (
          <span className={`stat-trend ${dashboardData[`${card.key}Trend`] > 0 ? 'positive' : 'negative'}`}>
            {dashboardData[`${card.key}Trend`] > 0 ? '↑' : '↓'} {Math.abs(dashboardData[`${card.key}Trend`])}%
          </span>
        )}
      </div>
    ));
  };

  return (
    <Layout>
      {getDashboardContent()}
    </Layout>
  );
};

export default Dashboard;