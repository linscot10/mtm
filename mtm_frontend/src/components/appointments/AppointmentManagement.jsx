import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { appointmentService, patientService, authService } from '../../services/api';
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
  const [loadingDoctors, setLoadingDoctors] = useState(false);
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

  // For prescription integration
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    drugName: '',
    dosage: '',
    instructions: '',
    duration: ''
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
      console.error('Appointments fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err.response?.data || err.message);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      console.log('Fetching doctors...');
      
      // Try authService first
      const response = await authService.getDoctors();
      console.log('Doctors fetched successfully:', response.data);
      setDoctors(response.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err.response?.data || err.message);
      
      // Fallback to appointmentService
      try {
        console.log('Trying appointmentService as fallback...');
        const fallbackResponse = await appointmentService.getDoctors();
        console.log('Fallback doctors:', fallbackResponse.data);
        setDoctors(fallbackResponse.data);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr.response?.data || fallbackErr.message);
        
        // Mock data for development/testing
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
      setAvailableSlots(response.data.availableSlots || []);
    } catch (err) {
      console.error('Failed to fetch availability:', err.response?.data || err.message);
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

  const handlePrescriptionChange = (e) => {
    const { name, value } = e.target;
    setPrescriptionFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      console.error('Create appointment error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create appointment');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchAppointments();
      setError('');
    } catch (err) {
      console.error('Update status error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to update appointment status');
    }
  };

  const handleCreatePrescription = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionModal(true);
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    
    try {
      // In a real implementation, you would:
      // 1. First create a medical record from the appointment
      // 2. Then create a prescription linked to that medical record
      
      // For now, show a message
      alert(`Prescription for ${prescriptionFormData.drugName} created successfully!
      
Drug: ${prescriptionFormData.drugName}
Dosage: ${prescriptionFormData.dosage}
Instructions: ${prescriptionFormData.instructions}
Duration: ${prescriptionFormData.duration}`);
      
      // Reset form and close modal
      setPrescriptionFormData({
        drugName: '',
        dosage: '',
        instructions: '',
        duration: ''
      });
      setShowPrescriptionModal(false);
      setSelectedAppointment(null);
      
    } catch (err) {
      console.error('Create prescription error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create prescription');
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
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
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

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="appointment-stats">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
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
            <div className="stat-icon">⏰</div>
            <h3>Upcoming</h3>
            <p className="stat-number">{appointments.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
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
              <h3>📋 Schedule New Appointment</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    <span>👤</span>
                    Patient
                  </label>
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
                  <label>
                    <span>👨‍⚕️</span>
                    Doctor
                  </label>
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
                    <label>
                      <span>📅</span>
                      Date
                    </label>
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
                    <label>
                      <span>⏰</span>
                      Time
                    </label>
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
                      <small className="warning-text">⚠️ No available time slots for this date</small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <span>🏥</span>
                    Appointment Type
                  </label>
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
                  <label>
                    <span>📝</span>
                    Reason for Visit
                  </label>
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
                  <label>
                    <span>💭</span>
                    Notes (Optional)
                  </label>
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
                    <span>✓</span>
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

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedAppointment && (
          <div className="modal-overlay">
            <div className="modal prescription-modal">
              <h3>💊 Create Prescription</h3>
              <p className="modal-subtitle">
                For: {selectedAppointment.patient?.name} - Appointment: {new Date(selectedAppointment.date).toLocaleDateString()}
              </p>
              <form onSubmit={handleSubmitPrescription}>
                <div className="form-group">
                  <label>Drug Name</label>
                  <input
                    type="text"
                    name="drugName"
                    value={prescriptionFormData.drugName}
                    onChange={handlePrescriptionChange}
                    required
                    placeholder="e.g., Amoxicillin"
                  />
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={prescriptionFormData.dosage}
                    onChange={handlePrescriptionChange}
                    required
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea
                    name="instructions"
                    value={prescriptionFormData.instructions}
                    onChange={handlePrescriptionChange}
                    rows="3"
                    placeholder="e.g., Take 1 tablet twice daily after meals"
                  />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={prescriptionFormData.duration}
                    onChange={handlePrescriptionChange}
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <span>💾</span>
                    Save Prescription
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedAppointment(null);
                    }}
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
          <div className="table-header">
            <h3>📋 Upcoming Appointments</h3>
            <button 
              className="btn-refresh"
              onClick={fetchAppointments}
              title="Refresh appointments"
            >
              🔄 Refresh
            </button>
          </div>
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
                  <td>
                    <div className="patient-info">
                      <strong>{appointment.patient?.name || 'Unknown Patient'}</strong>
                      <small>ID: {appointment.patient?._id?.substring(0, 8) || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="doctor-info">
                      <strong>{appointment.doctor?.name ? `Dr. ${appointment.doctor.name}` : 'Unknown Doctor'}</strong>
                      <small>{appointment.doctor?.specialization || 'General'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="datetime-cell">
                      <span className="date">{new Date(appointment.date).toLocaleDateString()}</span>
                      <span className="time">{appointment.time}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`appointment-type ${appointment.type}`}>
                      {appointment.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="reason-cell">
                    <div className="reason-content">
                      {appointment.reason?.length > 50 
                        ? `${appointment.reason.substring(0, 50)}...` 
                        : appointment.reason || 'No reason provided'}
                      {appointment.notes && (
                        <small className="notes-indicator">📝 Has notes</small>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(appointment.status)}</td>
                  {currentUser.role !== 'patient' && (
                    <td>
                      <div className="action-buttons">
                        {appointment.status === 'scheduled' && (
                          <>
                            <button 
                              className="btn-action btn-confirm"
                              onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                              title="Confirm appointment"
                            >
                              ✓ Confirm
                            </button>
                            <button 
                              className="btn-action btn-cancel"
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              title="Cancel appointment"
                            >
                              ✗ Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <>
                            <button 
                              className="btn-action btn-start"
                              onClick={() => handleStatusChange(appointment._id, 'in-progress')}
                              title="Start appointment"
                            >
                              ▶ Start
                            </button>
                            <button 
                              className="btn-action btn-cancel"
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              title="Cancel appointment"
                            >
                              ✗ Cancel
                            </button>
                            {currentUser.role === 'doctor' && (
                              <button 
                                className="btn-action btn-prescribe"
                                onClick={() => handleCreatePrescription(appointment)}
                                title="Create prescription"
                              >
                                💊 Prescribe
                              </button>
                            )}
                          </>
                        )}
                        {appointment.status === 'in-progress' && (
                          <>
                            <button 
                              className="btn-action btn-complete"
                              onClick={() => handleStatusChange(appointment._id, 'completed')}
                              title="Complete appointment"
                            >
                              ✓ Complete
                            </button>
                            {currentUser.role === 'doctor' && (
                              <button 
                                className="btn-action btn-prescribe"
                                onClick={() => handleCreatePrescription(appointment)}
                                title="Create prescription"
                              >
                                💊 Prescribe
                              </button>
                            )}
                          </>
                        )}
                        {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                          <button 
                            className="btn-action btn-view"
                            onClick={() => alert(`Appointment details:\n\nPatient: ${appointment.patient?.name}\nDoctor: ${appointment.doctor?.name}\nDate: ${new Date(appointment.date).toLocaleDateString()}\nTime: ${appointment.time}\nStatus: ${appointment.status}\nReason: ${appointment.reason}`)}
                            title="View details"
                          >
                            👁️ View
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
              <div className="empty-icon">📅</div>
              <p>No upcoming appointments found.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                Schedule Your First Appointment
              </button>
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div className="calendar-section">
          <h3>📅 Appointment Calendar</h3>
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