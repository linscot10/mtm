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
  const [debugInfo, setDebugInfo] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log('Current user:', currentUser);
    fetchPrescriptions();
    if (currentUser.role === 'doctor') {
      fetchMedicalRecords();
    }
  }, [currentUser.role, currentUser.id]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      console.log('Fetching prescriptions...');
      const response = await prescriptionService.getAll();
      console.log('Prescriptions response:', response.data);
      setPrescriptions(response.data || []);
      setError('');
      setDebugInfo(`Found ${response.data?.length || 0} prescriptions`);
    } catch (err) {
      console.error('Fetch prescriptions error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch prescriptions';
      setError(`❌ ${errorMsg}`);
      setDebugInfo(`Error fetching: ${err.response?.status || 'No response'} - ${err.message}`);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setLoadingRecords(true);
      console.log('Fetching medical records for doctor ID:', currentUser.id);
      
      // When a doctor calls GET /api/medical-records, the backend 
      // automatically filters by doctor ID, so we don't need to filter manually
      const response = await medicalRecordService.getAll();
      console.log('Medical records response:', response.data);
      
      if (!response.data || response.data.length === 0) {
        console.log('No medical records found for this doctor');
        setMedicalRecords([]);
        setDebugInfo('No medical records found for this doctor');
        return;
      }
      
      setMedicalRecords(response.data);
      setDebugInfo(`Found ${response.data.length} medical records`);
      
    } catch (err) {
      console.error('Fetch medical records error:', err);
      console.error('Full error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError('⚠️ Could not load medical records. Make sure you have created medical records first.');
      
      // Try alternative endpoint
      try {
        console.log('Trying getAllByDoctor endpoint...');
        const altResponse = await medicalRecordService.getAllByDoctor(currentUser.id);
        console.log('Alternative response:', altResponse.data);
        setMedicalRecords(altResponse.data || []);
        setDebugInfo(`Found ${altResponse.data?.length || 0} records via doctor endpoint`);
      } catch (altErr) {
        console.error('Alternative endpoint also failed:', altErr);
        
        // Provide mock data for testing
        const mockRecords = [
          { 
            _id: 'mock1', 
            patient: { _id: 'p1', name: 'Test Patient 1' },
            doctor: { _id: currentUser.id, name: currentUser.name || 'Dr. Test' },
            diagnosis: 'Hypertension',
            symptoms: 'High blood pressure, headaches',
            createdAt: new Date().toISOString()
          },
          { 
            _id: 'mock2', 
            patient: { _id: 'p2', name: 'Test Patient 2' },
            doctor: { _id: currentUser.id, name: currentUser.name || 'Dr. Test' },
            diagnosis: 'Diabetes Type 2',
            symptoms: 'High blood sugar, fatigue',
            createdAt: new Date().toISOString()
          }
        ];
        setMedicalRecords(mockRecords);
        setDebugInfo('Using mock records for development');
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
      
      // Validate medical record selection
      if (!formData.medicalRecord) {
        setError('❌ Please select a medical record');
        return;
      }
      
      const selectedRecord = medicalRecords.find(r => r._id === formData.medicalRecord);
      if (!selectedRecord) {
        setError('❌ Selected medical record not found');
        return;
      }
      
      const prescriptionData = {
        medicalRecord: formData.medicalRecord,
        drugName: formData.drugName.trim(),
        dosage: formData.dosage.trim(),
        instructions: (formData.instructions || '').trim(),
        duration: (formData.duration || '').trim()
      };
      
      console.log('Sending prescription data:', prescriptionData);
      const response = await prescriptionService.create(prescriptionData);
      console.log('Prescription created successfully:', response.data);
      
      // Reset form and refresh data
      setShowForm(false);
      setFormData({
        medicalRecord: '',
        drugName: '',
        dosage: '',
        instructions: '',
        duration: ''
      });
      
      await fetchPrescriptions();
      setError('');
      
      // Show success
      alert(`✅ Prescription created successfully!
      
Patient: ${selectedRecord.patient?.name}
Drug: ${formData.drugName}
Dosage: ${formData.dosage}`);
      
    } catch (err) {
      console.error('Create prescription error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create prescription';
      setError(`❌ ${errorMsg}`);
      
      // Show more specific errors
      if (err.response?.status === 404) {
        setError('❌ Medical record not found. Please select a valid record.');
      } else if (err.response?.status === 403) {
        setError('❌ You are not authorized to create prescriptions for this medical record');
      }
    }
  };

  const handleAdminister = async (id) => {
    if (!window.confirm('Mark this prescription as administered?')) return;
    
    try {
      await prescriptionService.administer(id);
      await fetchPrescriptions();
      alert('✅ Prescription marked as administered');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update status';
      setError(`❌ ${errorMsg}`);
    }
  };

  // Test endpoint function
  const testEndpoints = async () => {
    console.log('Testing endpoints...');
    
    try {
      // Test prescriptions endpoint
      console.log('Testing /api/prescriptions...');
      const presResponse = await prescriptionService.getAll();
      console.log('Prescriptions test result:', presResponse.status, presResponse.data);
      
      // Test medical records endpoint
      console.log('Testing /api/medical-records...');
      const medResponse = await medicalRecordService.getAll();
      console.log('Medical records test result:', medResponse.status, medResponse.data);
      
      // Test medical records by doctor endpoint
      console.log('Testing /api/medical-records/doctor/:id...');
      try {
        const doctorResponse = await medicalRecordService.getAllByDoctor(currentUser.id);
        console.log('Doctor records test:', doctorResponse.status, doctorResponse.data);
      } catch (doctorErr) {
        console.log('Doctor endpoint not available:', doctorErr.message);
      }
      
      setDebugInfo(`Endpoints OK: Prescriptions(${presResponse.status}), Medical Records(${medResponse.status})`);
    } catch (err) {
      console.error('Endpoint test failed:', err);
      setDebugInfo(`Test failed: ${err.message}`);
    }
  };

  // Create test medical record for development
  const createTestMedicalRecord = async () => {
    try {
      console.log('Creating test medical record...');
      
      // First, get a patient
      const patientsResponse = await patientService.getAll();
      const patients = patientsResponse.data || [];
      
      if (patients.length === 0) {
        setError('❌ No patients found. Please create a patient first.');
        return;
      }
      
      const testPatient = patients[0];
      
      // Create medical record
      const recordData = {
        patientId: testPatient._id,
        symptoms: 'Test symptoms for prescription creation',
        diagnosis: 'Test diagnosis',
        prescription: '',
        testsOrdered: ''
      };
      
      const response = await medicalRecordService.create(recordData);
      console.log('Test medical record created:', response.data);
      
      // Refresh medical records
      await fetchMedicalRecords();
      
      alert(`✅ Test medical record created for patient: ${testPatient.name}`);
    } catch (err) {
      console.error('Create test record error:', err);
      setError(`❌ Failed to create test record: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading prescriptions...</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              className="btn-secondary btn-sm"
              onClick={testEndpoints}
            >
              Test Endpoints
            </button>
            {medicalRecords.length === 0 && currentUser.role === 'doctor' && (
              <button 
                className="btn-primary btn-sm"
                onClick={createTestMedicalRecord}
              >
                Create Test Record
              </button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="prescriptions">
        <div className="page-header">
          <h2>💊 Prescriptions Management</h2>
          <div className="header-actions">
            <button 
              className="btn-secondary btn-sm"
              onClick={testEndpoints}
              title="Test API endpoints"
            >
              🔧 Test API
            </button>
            {medicalRecords.length === 0 && currentUser.role === 'doctor' && (
              <button 
                className="btn-warning btn-sm"
                onClick={createTestMedicalRecord}
                title="Create a test medical record"
              >
                ⚡ Create Test Record
              </button>
            )}
            {currentUser.role === 'doctor' && (
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
                disabled={loadingRecords}
              >
                <span>➕</span>
                New Prescription
              </button>
            )}
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="debug-info">
            <small>📊 {debugInfo}</small>
            {medicalRecords.length > 0 && (
              <div style={{ marginTop: '5px' }}>
                <small>First record ID: {medicalRecords[0]?._id}</small>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={`error-alert ${error.includes('❌') ? 'error' : 'warning'}`}>
            <span>{error.includes('❌') ? '❌' : '⚠️'}</span>
            {error.replace('❌', '').replace('⚠️', '').trim()}
          </div>
        )}

        {/* Quick Stats */}
        <div className="prescription-stats">
          <div className="stat-card">
            <h3>Total Prescriptions</h3>
            <p className="stat-number">{prescriptions.length}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-number">
              {prescriptions.filter(p => p.status === 'Pending').length}
            </p>
          </div>
          <div className="stat-card">
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
                  <label>Medical Record *</label>
                  <select
                    name="medicalRecord"
                    value={formData.medicalRecord}
                    onChange={handleChange}
                    required
                    disabled={loadingRecords}
                  >
                    <option value="">Select Medical Record</option>
                    {loadingRecords ? (
                      <option value="" disabled>Loading records...</option>
                    ) : medicalRecords.length === 0 ? (
                      <option value="" disabled>No medical records found</option>
                    ) : (
                      medicalRecords.map(record => (
                        <option key={record._id} value={record._id}>
                          {record.patient?.name || 'Unknown'} - 
                          {record.diagnosis ? ` ${record.diagnosis.substring(0, 30)}` : ' No diagnosis'}
                        </option>
                      ))
                    )}
                  </select>
                  {medicalRecords.length === 0 && !loadingRecords && (
                    <div className="form-help">
                      <p>⚠️ No medical records found. To create a prescription:</p>
                      <ol>
                        <li>Go to Medical Records page</li>
                        <li>Create a medical record for a patient</li>
                        <li>Refresh this page</li>
                      </ol>
                      <button 
                        type="button"
                        className="btn-sm btn-warning"
                        onClick={createTestMedicalRecord}
                        style={{ marginTop: '10px' }}
                      >
                        Or create a test record
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Drug Name *</label>
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
                    <label>Dosage *</label>
                    <input
                      type="text"
                      name="dosage"
                      value={formData.dosage}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 500mg twice daily"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., Take after meals with water"
                  />
                </div>

                <div className="form-group">
                  <label>Duration</label>
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
                    Create Prescription
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        medicalRecord: '',
                        drugName: '',
                        dosage: '',
                        instructions: '',
                        duration: ''
                      });
                    }}
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
            <h3>Prescriptions</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-secondary btn-sm"
                onClick={fetchPrescriptions}
              >
                🔄 Refresh
              </button>
              {medicalRecords.length === 0 && currentUser.role === 'doctor' && (
                <button 
                  className="btn-warning btn-sm"
                  onClick={createTestMedicalRecord}
                >
                  ⚡ Create Test Record
                </button>
              )}
            </div>
          </div>
          
          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <p>No prescriptions found.</p>
              {currentUser.role === 'doctor' && (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                    style={{ marginRight: '10px' }}
                  >
                    Create Your First Prescription
                  </button>
                  <button 
                    className="btn-warning"
                    onClick={createTestMedicalRecord}
                  >
                    Create Test Medical Record
                  </button>
                </>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Drug</th>
                  <th>Dosage</th>
                  <th>Status</th>
                  <th>Date</th>
                  {currentUser.role === 'pharmacist' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(prescription => (
                  <tr key={prescription._id}>
                    <td>{prescription.medicalRecord?.patient?.name || 'N/A'}</td>
                    <td>{prescription.drugName}</td>
                    <td>{prescription.dosage}</td>
                    <td>
                      <span className={`status-badge ${prescription.status.toLowerCase()}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td>
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </td>
                    {currentUser.role === 'pharmacist' && (
                      <td>
                        {prescription.status === 'Pending' ? (
                          <button 
                            className="btn-sm btn-primary"
                            onClick={() => handleAdminister(prescription._id)}
                          >
                            Mark Administered
                          </button>
                        ) : (
                          <span className="text-muted">Already administered</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Prescriptions;