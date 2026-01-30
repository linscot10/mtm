import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { appointmentService, patientService, authService } from '../../services/api'; // ADD authService
import { useAuth } from '../../contexts/AuthContext';
import './AppointmentManagement.css';

const AppointmentManagement = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false); // ADD loading state for doctors
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    type: 'consultation',
    duration: 30,
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    if (currentUser.role !== 'patient') {
      fetchDoctors();
    }
  }, [currentUser.role]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailability(selectedDoctor, selectedDate);
    }
  }, [selectedDate, selectedDoctor]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getUpcoming();
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error('Appointments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      console.log('Fetching doctors...');
      
      // Try authService first (from your updated auth.js)
      const response = await authService.getDoctors();
      console.log('Doctors fetched successfully:', response.data);
      setDoctors(response.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      console.log('Error details:', err.response?.data || err.message);
      
      // Fallback: Try appointmentService as alternative
      try {
        console.log('Trying appointmentService as fallback...');
        const fallbackResponse = await appointmentService.getDoctors();
        console.log('Fallback doctors:', fallbackResponse.data);
        setDoctors(fallbackResponse.data);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        
        // Provide mock data for testing
        setDoctors([
          { _id: '1', name: 'Dr. Smith', specialization: 'Cardiology', email: 'smith@hospital.com' },
          { _id: '2', name: 'Dr. Johnson', specialization: 'Pediatrics', email: 'johnson@hospital.com' },
          { _id: '3', name: 'Dr. Williams', specialization: 'Neurology', email: 'williams@hospital.com' }
        ]);
      }
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchAvailability = async (doctorId, date) => {
    try {
      const response = await appointmentService.getAvailability(doctorId, date);
      setAvailableSlots(response.data.availableSlots);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      // Provide mock slots for testing
      setAvailableSlots(['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00']);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'date') {
      setSelectedDate(value);
    }
    if (name === 'doctorId') {
      setSelectedDoctor(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await appointmentService.create(formData);
      setShowForm(false);
      setFormData({
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        reason: '',
        type: 'consultation',
        duration: 30,
        notes: ''
      });
      fetchAppointments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create appointment');
      console.error('Create appointment error:', err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update appointment status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'scheduled': { color: 'blue', label: 'Scheduled' },
      'confirmed': { color: 'green', label: 'Confirmed' },
      'in-progress': { color: 'orange', label: 'In Progress' },
      'completed': { color: 'purple', label: 'Completed' },
      'cancelled': { color: 'red', label: 'Cancelled' },
      'no-show': { color: 'gray', label: 'No Show' }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status };
    
    return (
      <span className={`status-badge ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading appointments...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="appointment-management">
        <div className="page-header">
          <h2>Appointment Management</h2>
          {currentUser.role !== 'patient' && (
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              Schedule New Appointment
            </button>
          )}
        </div>

        {error && <div className="error-alert">{error}</div>}

        {/* Quick Stats */}
        <div className="appointment-stats">
          <div className="stat-card">
            <h3>Today's Appointments</h3>
            <p className="stat-number">
              {appointments.filter(a => {
                const today = new Date().toDateString();
                const appDate = new Date(a.date).toDateString();
                return today === appDate;
              }).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Upcoming</h3>
            <p className="stat-number">{appointments.length}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Confirmation</h3>
            <p className="stat-number">
              {appointments.filter(a => a.status === 'scheduled').length}
            </p>
          </div>
        </div>

        {/* Schedule Appointment Form */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal appointment-modal">
              <h3>Schedule New Appointment</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Patient</label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                    disabled={patients.length === 0}
                  >
                    <option value="">Select Patient</option>
                    {patients.length === 0 ? (
                      <option value="" disabled>Loading patients...</option>
                    ) : (
                      patients.map(patient => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name} ({patient.gender}, {new Date(patient.dob).toLocaleDateString()})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Doctor</label>
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    required
                    disabled={doctors.length === 0 || loadingDoctors}
                  >
                    <option value="">Select Doctor</option>
                    {loadingDoctors ? (
                      <option value="" disabled>Loading doctors...</option>
                    ) : doctors.length === 0 ? (
                      <option value="" disabled>No doctors available</option>
                    ) : (
                      doctors.map(doctor => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {loadingDoctors && <small className="loading-text">Loading doctors list...</small>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time</label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      disabled={!selectedDate || !selectedDoctor || availableSlots.length === 0}
                    >
                      <option value="">Select Time</option>
                      {!selectedDate || !selectedDoctor ? (
                        <option value="" disabled>Select date and doctor first</option>
                      ) : availableSlots.length === 0 ? (
                        <option value="" disabled>No available slots</option>
                      ) : (
                        availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))
                      )}
                    </select>
                    {selectedDate && selectedDoctor && availableSlots.length === 0 && (
                      <small className="warning-text">No available time slots for this date</small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Appointment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="routine-check">Routine Check</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason for Visit</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Describe the reason for the appointment..."
                  />
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Schedule Appointment
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        <div className="appointments-table">
          <h3>Upcoming Appointments</h3>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                {currentUser.role !== 'patient' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment._id}>
                  <td>{appointment.patient?.name || 'Unknown Patient'}</td>
                  <td>{appointment.doctor?.name ? `Dr. ${appointment.doctor.name}` : 'Unknown Doctor'}</td>
                  <td>
                    {new Date(appointment.date).toLocaleDateString()}
                    <br />
                    <small>{appointment.time}</small>
                  </td>
                  <td>
                    <span className="appointment-type">
                      {appointment.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="reason-cell">
                    {appointment.reason?.length > 50 
                      ? `${appointment.reason.substring(0, 50)}...` 
                      : appointment.reason || 'No reason provided'}
                  </td>
                  <td>{getStatusBadge(appointment.status)}</td>
                  {currentUser.role !== 'patient' && (
                    <td>
                      <div className="action-buttons">
                        {appointment.status === 'scheduled' && (
                          <>
                            <button 
                              className="btn-sm btn-success"
                              onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                            >
                              Confirm
                            </button>
                            <button 
                              className="btn-sm btn-danger"
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <>
                            <button 
                              className="btn-sm btn-warning"
                              onClick={() => handleStatusChange(appointment._id, 'in-progress')}
                            >
                              Start
                            </button>
                            <button 
                              className="btn-sm btn-danger"
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === 'in-progress' && (
                          <button 
                            className="btn-sm btn-primary"
                            onClick={() => handleStatusChange(appointment._id, 'completed')}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {appointments.length === 0 && (
            <div className="empty-state">
              <p>No upcoming appointments found.</p>
            </div>
          )}
        </div>

        {/* Calendar View (Optional) */}
        <div className="calendar-section">
          <h3>Appointment Calendar</h3>
          <div className="calendar-placeholder">
            <p>Calendar view coming soon...</p>
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-color scheduled"></span>
                <span>Scheduled</span>
              </div>
              <div className="legend-item">
                <span className="legend-color confirmed"></span>
                <span>Confirmed</span>
              </div>
              <div className="legend-item">
                <span className="legend-color in-progress"></span>
                <span>In Progress</span>
              </div>
              <div className="legend-item">
                <span className="legend-color completed"></span>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AppointmentManagement;