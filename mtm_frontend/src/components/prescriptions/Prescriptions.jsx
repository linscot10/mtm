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
      const response = await prescriptionService.getAll();
      setPrescriptions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch prescriptions');
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      // This would need to be implemented based on available endpoints
      // For now, we'll use a placeholder
      const response = await medicalRecordService.getAll();
      setMedicalRecords(response.data);
    } catch (err) {
      setError('Failed to fetch medical records');
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
    } catch (err) {
      setError('Failed to create prescription');
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

  if (loading) return <Layout><div>Loading...</div></Layout>;

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
                  >
                    <option value="">Select Medical Record</option>
                    {medicalRecords.map(record => (
                      <option key={record._id} value={record._id}>
                        {record.patient?.name} - {record.diagnosis || 'No diagnosis'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Drug Name</label>
                  <input
                    type="text"
                    name="drugName"
                    value={formData.drugName}
                    onChange={handleChange}
                    required
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
                  <button type="submit" className="btn-primary">Create</button>
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
                  <td>{prescription.medicalRecord?.patient?.name}</td>
                  <td>{prescription.drugName}</td>
                  <td>{prescription.dosage}</td>
                  <td>{prescription.medicalRecord?.diagnosis || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${prescription.status.toLowerCase()}`}>
                      {prescription.status}
                    </span>
                  </td>
                  <td>{prescription.medicalRecord?.doctor?.name}</td>
                  {currentUser.role === 'pharmacist' && (
                    <td>
                      {prescription.status === 'Pending' && (
                        <button 
                          className="btn-sm"
                          onClick={() => handleAdminister(prescription._id)}
                        >
                          Mark as Administered
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {prescriptions.length === 0 && (
          <p className="no-data">No prescriptions found.</p>
        )}
      </div>
    </Layout>
  );
};

export default Prescriptions;