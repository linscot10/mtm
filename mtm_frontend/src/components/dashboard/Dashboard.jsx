import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService, vitalsService, appointmentService } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [vitalsStats, setVitalsStats] = useState(null);
  const [criticalVitals, setCriticalVitals] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    if (currentUser.role === 'nurse') {
      fetchVitalsData();
      fetchTodayAppointments();
    }
  }, [currentUser.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats(currentUser.role);
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      console.log('Dashboard stats not available, using default data');
      setDashboardData(getDefaultDashboardData());
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalsData = async () => {
    try {
      // Fetch vitals statistics
      const statsResponse = await vitalsService.getStats();
      setVitalsStats(statsResponse.data);
      
      // Fetch critical vitals
      const criticalResponse = await vitalsService.getCritical();
      setCriticalVitals(criticalResponse.data.slice(0, 3)); // Get top 3 critical
    } catch (err) {
      console.error('Vitals data error:', err);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const response = await appointmentService.getToday();
      setTodayAppointments(response.data);
    } catch (err) {
      console.error('Appointments data error:', err);
    }
  };

  const getDefaultDashboardData = () => {
    const defaults = {
      doctor: {
        patientsToday: 0,
        pendingRecords: 0,
        todayAppointments: 0,
        totalPatients: 0
      },
      nurse: {
        newPatients: 0,
        vitalsToCheck: 0,
        criticalVitals: 0,
        attentionRequired: 0,
        patientsToday: 0,
        totalPatients: 0
      },
      lab: {
        pendingTests: 0,
        completedTestsToday: 0,
        totalTestsThisWeek: 0
      },
      pharmacist: {
        pendingPrescriptions: 0,
        dispensedToday: 0,
        totalPrescriptionsThisWeek: 0
      },
      patient: {
        medicalRecordsCount: 0,
        upcomingAppointments: 0,
        labResultsCount: 0,
        prescriptionsCount: 0
      }
    };
    
    return defaults[currentUser.role] || defaults.patient;
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
        { icon: '📅', label: 'Schedule Appointments', path: '/appointments' }
      ],
      nurse: [
        { icon: '👥', label: 'Patient List', path: '/patients' },
        { icon: '❤️', label: 'Record Vitals', path: '/vitals' },
        { icon: '📋', label: 'Medical Records', path: '/medical-records' },
        { icon: '📅', label: 'Today\'s Schedule', path: '/appointments' },
        { icon: '📝', label: 'Quick Notes', path: '/notes' }
      ],
      lab: [
        { icon: '🧪', label: 'Test Orders', path: '/lab-results' },
        { icon: '🔬', label: 'Upload Results', path: '/lab-results' },
        { icon: '📊', label: 'Reports', path: '/reports' }
      ],
      pharmacist: [
        { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
        // { icon: '📦', label: 'Inventory', path: '/inventory' },
        { icon: '✅', label: 'Dispense History', path: '/prescriptions' }
      ],
      patient: [
        { icon: '📋', label: 'My Records', path: '/medical-records' },
        { icon: '💊', label: 'My Prescriptions', path: '/prescriptions' },
        { icon: '🔬', label: 'Lab Results', path: '/lab-results' },
        { icon: '📅', label: 'Appointments', path: '/appointments' }
      ]
    };
    
    return actions[currentUser.role] || [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const getDashboardContent = () => {
    const roleClass = `${currentUser.role}-dashboard`;

    return (
      <div className={`dashboard-content ${roleClass}`}>
        <div className="dashboard-header">
          <h1>
            {getRoleIcon()} {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard
          </h1>
          <p className="welcome-message">Welcome back! Here's your overview for today.</p>
        </div>

        <div className="stats-grid">
          {getStatsCards()}
        </div>

        {/* Vital Signs Section for Nurses */}
        {currentUser.role === 'nurse' && (
          <div className="vitals-dashboard-section">
            <div className="section-header">
              <h2><span className="icon">❤️</span> Vital Signs Monitoring</h2>
              <Link to="/vitals" className="btn-primary">
                View All Vitals
              </Link>
            </div>
            
            {vitalsStats && (
              <div className="vitals-overview">
                <div className="vitals-stat-card">
                  <div className="vitals-stat">
                    <span className="stat-number">{vitalsStats.totalVitals || 0}</span>
                    <span className="stat-label">Total Records</span>
                  </div>
                </div>
                <div className="vitals-stat-card critical">
                  <div className="vitals-stat">
                    <span className="stat-number">{vitalsStats.criticalVitals || 0}</span>
                    <span className="stat-label">Critical</span>
                  </div>
                </div>
                <div className="vitals-stat-card attention">
                  <div className="vitals-stat">
                    <span className="stat-number">{vitalsStats.attentionRequired || 0}</span>
                    <span className="stat-label">Needs Attention</span>
                  </div>
                </div>
                <div className="vitals-stat-card">
                  <div className="vitals-stat">
                    <span className="stat-number">{vitalsStats.vitalsToday || 0}</span>
                    <span className="stat-label">Today</span>
                  </div>
                </div>
              </div>
            )}

            {/* Critical Vitals Alerts */}
            {criticalVitals && criticalVitals.length > 0 && (
              <div className="critical-alerts">
                <h3>⚠️ Critical Vitals Alert</h3>
                <div className="alerts-list">
                  {criticalVitals.map((vital, index) => (
                    <div key={index} className="alert-card">
                      <div className="alert-header">
                        <span className="patient-name">{vital.patient?.name}</span>
                        <span className="alert-time">
                          {new Date(vital.recordedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="alert-details">
                        {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                          <span className="vital-item">
                            BP: <strong>{vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}</strong>
                          </span>
                        )}
                        {vital.heartRate && (
                          <span className="vital-item">
                            HR: <strong>{vital.heartRate} BPM</strong>
                          </span>
                        )}
                        {vital.temperature && (
                          <span className="vital-item">
                            Temp: <strong>{vital.temperature}°C</strong>
                          </span>
                        )}
                        {vital.oxygenSaturation && (
                          <span className="vital-item">
                            SpO₂: <strong>{vital.oxygenSaturation}%</strong>
                          </span>
                        )}
                      </div>
                      <div className="alert-actions">
                        <Link 
                          to={`/vitals`}
                          className="btn-sm btn-primary"
                        >
                          View Details
                        </Link>
                        <Link 
                          to={`/patients/`}
                          className="btn-sm btn-secondary"
                        >
                          Patient Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Appointments for Nurses */}
            {todayAppointments.length > 0 && (
              <div className="today-appointments">
                <h3><span className="icon">📅</span> Today's Appointments</h3>
                <div className="appointments-list">
                  {todayAppointments.slice(0, 3).map((appointment, index) => (
                    <div key={index} className="appointment-card">
                      <div className="appointment-header">
                        <span className="patient-name">{appointment.patient?.name}</span>
                        <span className="appointment-time">{appointment.time}</span>
                      </div>
                      <div className="appointment-details">
                        <span className="appointment-type">
                          {appointment.type.replace('-', ' ')}
                        </span>
                        <span className="appointment-doctor">
                          Dr. {appointment.doctor?.name}
                        </span>
                      </div>
                      <div className="appointment-actions">
                        <Link 
                          to={`/appointments`}
                          className="btn-sm btn-primary"
                        >
                          View
                        </Link>
                        <Link 
                          to={`/patients/${appointment.patient?._id}`}
                          className="btn-sm btn-secondary"
                        >
                          Patient
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {todayAppointments.length > 3 && (
                  <div className="view-all">
                    <Link to="/appointments" className="view-all-link">
                      View all {todayAppointments.length} appointments →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Quick Vitals Entry */}
            <div className="quick-vitals-entry">
              <h3>📝 Quick Vitals Entry</h3>
              <div className="quick-form">
                <select className="patient-select">
                  <option value="">Select Patient</option>
                  <option value="1">John Doe</option>
                  <option value="2">Jane Smith</option>
                </select>
                <div className="vitals-inputs">
                  <input type="text" placeholder="BP (120/80)" />
                  <input type="text" placeholder="HR (72)" />
                  <input type="text" placeholder="Temp (°C)" />
                </div>
                <button className="btn-primary" onClick={() => window.location.href = '/vitals'}>
                  Record Full Vitals
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Section for Doctors */}
        {currentUser.role === 'doctor' && dashboardData?.todayAppointments > 0 && (
          <div className="doctor-appointments-section">
            <div className="section-header">
              <h2><span className="icon">📅</span> Today's Appointments</h2>
              <Link to="/appointments" className="btn-primary">
                Manage Schedule
              </Link>
            </div>
            <div className="appointments-summary">
              <div className="summary-card">
                <span className="summary-number">{dashboardData.todayAppointments}</span>
                <span className="summary-label">Appointments Today</span>
              </div>
              <div className="summary-card">
                <span className="summary-number">{dashboardData.patientsToday}</span>
                <span className="summary-label">Patients Today</span>
              </div>
              <div className="summary-actions">
                <Link to="/appointments" className="btn-primary">
                  View Schedule
                </Link>
                <Link to="/appointments?create=true" className="btn-secondary">
                  Add Appointment
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        {getQuickActions().length > 0 && (
          <div className="quick-actions-section">
            <h2><span className="icon">⚡</span> Quick Actions</h2>
            <div className="action-grid">
              {getQuickActions().map((action, index) => (
                <Link 
                  key={index} 
                  to={action.path} 
                  className="action-card"
                >
                  <div className="action-icon">{action.icon}</div>
                  <h3>{action.label}</h3>
                  <p>Click to access</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2><span className="icon">📋</span> Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👥</span>
              <div className="activity-details">
                <span className="activity-text">New patient registered</span>
                <span className="activity-time">10 min ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📋</span>
              <div className="activity-details">
                <span className="activity-text">Medical record updated</span>
                <span className="activity-time">30 min ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💊</span>
              <div className="activity-details">
                <span className="activity-text">Prescription dispensed</span>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📅</span>
              <div className="activity-details">
                <span className="activity-text">Appointment scheduled</span>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatsCards = () => {
    if (!dashboardData) return null;

    const statsConfig = {
      doctor: [
        { key: 'patientsToday', label: 'Patients Today', icon: '👥', color: 'blue' },
        { key: 'pendingRecords', label: 'Pending Records', icon: '📋', color: 'orange' },
        { key: 'todayAppointments', label: 'Appointments', icon: '📅', color: 'green' },
        { key: 'totalPatients', label: 'Total Patients', icon: '👥', color: 'purple' }
      ],
      nurse: [
        { key: 'newPatients', label: 'New Patients', icon: '🆕', color: 'blue' },
        { key: 'vitalsToCheck', label: 'Vitals to Check', icon: '❤️', color: 'red' },
        { key: 'criticalVitals', label: 'Critical Vitals', icon: '⚠️', color: 'red' },
        { key: 'patientsToday', label: 'Patients Today', icon: '👥', color: 'green' },
        { key: 'totalPatients', label: 'Total Patients', icon: '👥', color: 'purple' }
      ],
      lab: [
        { key: 'pendingTests', label: 'Pending Tests', icon: '⏳', color: 'orange' },
        { key: 'completedTestsToday', label: 'Completed Today', icon: '✅', color: 'green' },
        { key: 'totalTestsThisWeek', label: 'Total This Week', icon: '📊', color: 'blue' }
      ],
      pharmacist: [
        { key: 'pendingPrescriptions', label: 'Pending Prescriptions', icon: '⏳', color: 'orange' },
        { key: 'dispensedToday', label: 'Dispensed Today', icon: '✅', color: 'green' },
        { key: 'totalPrescriptionsThisWeek', label: 'Total This Week', icon: '📊', color: 'blue' }
      ],
      patient: [
        { key: 'medicalRecordsCount', label: 'Medical Records', icon: '📋', color: 'blue' },
        { key: 'upcomingAppointments', label: 'Upcoming Appointments', icon: '📅', color: 'green' },
        { key: 'labResultsCount', label: 'Lab Results', icon: '🔬', color: 'purple' },
        { key: 'prescriptionsCount', label: 'Prescriptions', icon: '💊', color: 'orange' }
      ]
    };

    const cards = statsConfig[currentUser.role] || [];
    
    return cards.map((card, index) => (
      <div key={index} className={`stat-card ${card.color}`}>
        <div className="stat-icon">{card.icon}</div>
        <div className="stat-content">
          <h3>{card.label}</h3>
          <p className="stat-number">{dashboardData[card.key] || 0}</p>
        </div>
      </div>
    ));
  };

  return (
    <Layout>
      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn-sm">
            Retry
          </button>
        </div>
      )}
      {getDashboardContent()}
    </Layout>
  );
};

export default Dashboard;