import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { prescriptionService, medicalRecordService } from '../../services/api';
import './Prescriptions.css';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medicalRecord: '',
    drugName: '',
    dosage: '',
    instructions: '',
    duration: ''
  });
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPrescriptions();
    if (currentUser.role === 'doctor') {
      fetchMedicalRecords();
    }
  }, [currentUser.role]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getAll();
      setPrescriptions(response.data || []);
      setError('');
    } catch (err) {
      console.error('Fetch prescriptions error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to fetch prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setLoadingRecords(true);
      console.log('Fetching medical records for doctor:', currentUser.id);
      
      // Try to get medical records for the current doctor
      const response = await medicalRecordService.getAll();
      console.log('Medical records response:', response.data);
      
      // Filter records to only show those created by the current doctor
      const doctorRecords = response.data.filter(record => 
        record.doctor && record.doctor._id === currentUser.id
      );
      
      setMedicalRecords(doctorRecords || []);
      setError('');
    } catch (err) {
      console.error('Fetch medical records error:', err.response?.data || err.message);
      setError('Failed to fetch medical records. Please try again.');
      
      // Fallback: Try a different endpoint or provide mock data for testing
      try {
        console.log('Trying alternative approach...');
        // If getAll() fails, try getting records by doctor ID
        const doctorId = currentUser.id;
        const altResponse = await medicalRecordService.getAllByDoctor(doctorId);
        setMedicalRecords(altResponse.data || []);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        
        // Provide mock data for development/testing
        setMedicalRecords([
          { 
            _id: '1', 
            patient: { _id: 'p1', name: 'John Doe' },
            doctor: { _id: currentUser.id, name: 'Dr. Smith' },
            diagnosis: 'Common Cold',
            symptoms: 'Cough, fever, headache',
            createdAt: new Date().toISOString()
          },
          { 
            _id: '2', 
            patient: { _id: 'p2', name: 'Jane Smith' },
            doctor: { _id: currentUser.id, name: 'Dr. Smith' },
            diagnosis: 'Hypertension',
            symptoms: 'High blood pressure',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating prescription with data:', formData);
      
      // Prepare the data for the backend
      const prescriptionData = {
        medicalRecord: formData.medicalRecord,
        drugName: formData.drugName,
        dosage: formData.dosage,
        instructions: formData.instructions || '',
        duration: formData.duration || ''
      };
      
      const response = await prescriptionService.create(prescriptionData);
      console.log('Prescription created:', response.data);
      
      setShowForm(false);
      setFormData({
        medicalRecord: '',
        drugName: '',
        dosage: '',
        instructions: '',
        duration: ''
      });
      
      // Refresh the prescriptions list
      await fetchPrescriptions();
      setError('');
      
      // Show success message
      alert('Prescription created successfully!');
      
    } catch (err) {
      console.error('Create prescription error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create prescription');
    }
  };

  const handleAdminister = async (id) => {
    if (!window.confirm('Are you sure you want to mark this prescription as administered?')) {
      return;
    }
    
    try {
      console.log('Administering prescription:', id);
      await prescriptionService.administer(id);
      
      // Refresh the list
      await fetchPrescriptions();
      setError('');
      
      // Show success message
      alert('Prescription marked as administered!');
    } catch (err) {
      console.error('Administer error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to update prescription status');
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading prescriptions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="prescriptions">
        <div className="page-header">
          <h2>💊 Prescriptions Management</h2>
          {currentUser.role === 'doctor' && (
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
              disabled={loadingRecords}
            >
              <span>➕</span>
              Create New Prescription
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
        <div className="prescription-stats">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <h3>Total Prescriptions</h3>
            <p className="stat-number">{prescriptions.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <h3>Pending</h3>
            <p className="stat-number">
              {prescriptions.filter(p => p.status === 'Pending').length}
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>Administered</h3>
            <p className="stat-number">
              {prescriptions.filter(p => p.status === 'Administered').length}
            </p>
          </div>
        </div>

        {/* Create Prescription Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>💊 Create Prescription</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    <span>📝</span>
                    Medical Record
                  </label>
                  <select
                    name="medicalRecord"
                    value={formData.medicalRecord}
                    onChange={handleChange}
                    required
                    disabled={loadingRecords || medicalRecords.length === 0}
                  >
                    <option value="">Select Medical Record</option>
                    {loadingRecords ? (
                      <option value="" disabled>Loading medical records...</option>
                    ) : medicalRecords.length === 0 ? (
                      <option value="" disabled>No medical records found</option>
                    ) : (
                      medicalRecords.map(record => (
                        <option key={record._id} value={record._id}>
                          {record.patient?.name || 'Unknown Patient'} - 
                          {record.diagnosis ? ` ${record.diagnosis}` : ' No diagnosis'} - 
                          {formatDate(record.createdAt)}
                        </option>
                      ))
                    )}
                  </select>
                  {medicalRecords.length === 0 && !loadingRecords && (
                    <small className="warning-text">
                      ⚠️ No medical records found. Please create a medical record first.
                    </small>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <span>💊</span>
                      Drug Name
                    </label>
                    <input
                      type="text"
                      name="drugName"
                      value={formData.drugName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <span>⚖️</span>
                      Dosage
                    </label>
                    <input
                      type="text"
                      name="dosage"
                      value={formData.dosage}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 500mg"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>
                    <span>📋</span>
                    Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g., Take 1 tablet twice daily after meals"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <span>⏰</span>
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 7 days"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loadingRecords || medicalRecords.length === 0}
                  >
                    <span>💾</span>
                    Create Prescription
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

        {/* Prescriptions Table */}
        <div className="prescriptions-table">
          <div className="table-header">
            <h3>📋 All Prescriptions</h3>
            <button 
              className="btn-refresh"
              onClick={fetchPrescriptions}
              title="Refresh prescriptions"
            >
              🔄 Refresh
            </button>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Drug Name</th>
                <th>Dosage</th>
                <th>Instructions</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Prescribing Doctor</th>
                <th>Date</th>
                {currentUser.role === 'pharmacist' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={currentUser.role === 'pharmacist' ? 9 : 8}>
                    <div className="no-data-message">
                      <p>📭 No prescriptions found</p>
                      {currentUser.role === 'doctor' && (
                        <button 
                          className="btn-primary"
                          onClick={() => setShowForm(true)}
                        >
                          Create Your First Prescription
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                prescriptions.map(prescription => (
                  <tr key={prescription._id}>
                    <td>
                      <div className="patient-info">
                        <strong>{prescription.medicalRecord?.patient?.name || 'Unknown'}</strong>
                        {prescription.medicalRecord?.patient?.dob && (
                          <small>DOB: {formatDate(prescription.medicalRecord.patient.dob)}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="drug-name">{prescription.drugName}</span>
                    </td>
                    <td>
                      <span className="dosage">{prescription.dosage}</span>
                    </td>
                    <td className="instructions-cell">
                      {prescription.instructions || 'No specific instructions'}
                    </td>
                    <td>
                      <span className="diagnosis">
                        {prescription.medicalRecord?.diagnosis || 'N/A'}
                      </span>
                      {prescription.medicalRecord?.symptoms && (
                        <small className="symptoms">
                          {prescription.medicalRecord.symptoms.substring(0, 30)}...
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${prescription.status?.toLowerCase() || 'pending'}`}>
                        {prescription.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="doctor-info">
                        <strong>{prescription.medicalRecord?.doctor?.name || 'Unknown'}</strong>
                      </div>
                    </td>
                    <td>
                      {formatDate(prescription.createdAt)}
                    </td>
                    {currentUser.role === 'pharmacist' && (
                      <td>
                        {prescription.status === 'Pending' ? (
                          <button 
                            className="btn-action btn-administer"
                            onClick={() => handleAdminister(prescription._id)}
                            title="Mark as administered"
                          >
                            ✅ Administer
                          </button>
                        ) : (
                          <span className="administered-info">
                            ✅ Administered
                            {prescription.pharmacist && (
                              <small>by {prescription.pharmacist.name}</small>
                            )}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Additional Information */}
        <div className="prescription-info">
          <h3>📋 Prescription Guidelines</h3>
          <div className="guidelines">
            <div className="guideline-card">
              <h4>👨‍⚕️ For Doctors</h4>
              <ul>
                <li>Always verify patient identity before prescribing</li>
                <li>Include clear dosage and administration instructions</li>
                <li>Check for potential drug interactions</li>
                <li>Include duration of treatment</li>
              </ul>
            </div>
            <div className="guideline-card">
              <h4>💊 For Pharmacists</h4>
              <ul>
                <li>Verify prescription authenticity</li>
                <li>Check dosage calculations</li>
                <li>Ensure proper labeling</li>
                <li>Update status when administered</li>
              </ul>
            </div>
            <div className="guideline-card">
              <h4>📋 Prescription Status</h4>
              <div className="status-guide">
                <div className="status-item">
                  <span className="status-indicator pending"></span>
                  <span>Pending - Awaiting pharmacy</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator administered"></span>
                  <span>Administered - Medication dispensed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Prescriptions;