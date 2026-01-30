import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { prescriptionService } from '../../services/api';
import './Prescriptions.css';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medicalRecord: '',
    drugName: '',
    dosage: ''
  });
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setPrescriptions(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch prescriptions');
      console.error('Fetch prescriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      // Use the new endpoint
      const response = await prescriptionService.getMedicalRecords();
      setMedicalRecords(response.data);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      // Try fallback if the new endpoint doesn't exist
      try {
        const fallbackResponse = await prescriptionService.getAll();
        // Extract medical records from prescriptions
        const records = [...new Set(fallbackResponse.data
          .filter(p => p.medicalRecord)
          .map(p => p.medicalRecord))];
        setMedicalRecords(records);
      } catch (fallbackErr) {
        setError('Failed to load medical records for prescription creation');
      }
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
      await prescriptionService.create(formData);
      setShowForm(false);
      setFormData({
        medicalRecord: '',
        drugName: '',
        dosage: ''
      });
      fetchPrescriptions();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create prescription');
      console.error('Create prescription error:', err);
    }
  };

  const handleAdminister = async (id) => {
    try {
      await prescriptionService.administer(id);
      fetchPrescriptions();
    } catch (err) {
      setError('Failed to update prescription status');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading prescriptions...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="prescriptions">
        <div className="page-header">
          <h2>Prescriptions Management</h2>
          {currentUser.role === 'doctor' && (
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              Create New Prescription
            </button>
          )}
        </div>

        {error && <div className="error-alert">{error}</div>}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Create Prescription</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Medical Record</label>
                  <select
                    name="medicalRecord"
                    value={formData.medicalRecord}
                    onChange={handleChange}
                    required
                    disabled={medicalRecords.length === 0}
                  >
                    <option value="">Select Medical Record</option>
                    {medicalRecords.length === 0 ? (
                      <option value="" disabled>No medical records found</option>
                    ) : (
                      medicalRecords.map(record => (
                        <option key={record._id || record.id} value={record._id || record.id}>
                          {record.patient?.name || 'Unknown Patient'} - {record.diagnosis || 'No diagnosis'}
                        </option>
                      ))
                    )}
                  </select>
                  {medicalRecords.length === 0 && currentUser.role === 'doctor' && (
                    <small className="warning-text">
                      You need to create medical records first before prescribing medication.
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Drug Name</label>
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
                  <label>Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 500mg twice daily"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={medicalRecords.length === 0}
                  >
                    Create
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

        <div className="prescriptions-table">
          <h3>Prescriptions</h3>
          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <p>No prescriptions found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Drug Name</th>
                  <th>Dosage</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Prescribing Doctor</th>
                  {currentUser.role === 'pharmacist' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(prescription => (
                  <tr key={prescription._id}>
                    <td>{prescription.medicalRecord?.patient?.name || 'Unknown'}</td>
                    <td>{prescription.drugName}</td>
                    <td>{prescription.dosage}</td>
                    <td>{prescription.medicalRecord?.diagnosis || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${prescription.status.toLowerCase()}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td>{prescription.medicalRecord?.doctor?.name || 'Unknown Doctor'}</td>
                    {currentUser.role === 'pharmacist' && (
                      <td>
                        {prescription.status === 'Pending' && (
                          <button 
                            className="btn-sm btn-success"
                            onClick={() => handleAdminister(prescription._id)}
                          >
                            Mark as Administered
                          </button>
                        )}
                        {prescription.status === 'Administered' && (
                          <span className="dispensed-info">
                            Dispensed by: {prescription.pharmacist?.name || 'Unknown'}
                            <br />
                            <small>
                              {prescription.updatedAt 
                                ? new Date(prescription.updatedAt).toLocaleDateString()
                                : 'Unknown date'}
                            </small>
                          </span>
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