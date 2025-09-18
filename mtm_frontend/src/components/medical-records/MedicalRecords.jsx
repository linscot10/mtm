import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { medicalRecordService, patientService } from '../../services/api';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    symptoms: '',
    diagnosis: '',
    prescription: '',
    testsOrdered: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchRecords(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll();
      setPatients(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch patients. Please try again.');
      console.error('Fetch patients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (patientId) => {
    try {
      const response = await medicalRecordService.getAllByPatient(patientId);
      setRecords(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch medical records.');
      console.error('Fetch records error:', err);
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
      if (editingRecord) {
        await medicalRecordService.update(editingRecord._id, formData);
        setEditingRecord(null);
      } else {
        await medicalRecordService.create(formData);
      }
      setShowForm(false);
      resetForm();
      if (formData.patientId) {
        fetchRecords(formData.patientId);
      }
      setError('');
    } catch (err) {
      setError('Failed to save medical record. Please try again.');
      console.error('Save record error:', err);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      patientId: record.patient._id,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis || '',
      prescription: record.prescription || '',
      testsOrdered: record.testsOrdered || ''
    });
    setShowForm(true);
  };

  const handleView = (record) => {
    setViewingRecord(record);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      try {
        await medicalRecordService.delete(id);
        if (selectedPatient) {
          fetchRecords(selectedPatient);
        }
        setError('');
      } catch (err) {
        setError('Failed to delete medical record.');
        console.error('Delete record error:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      symptoms: '',
      diagnosis: '',
      prescription: '',
      testsOrdered: ''
    });
    setEditingRecord(null);
  };

  const closeModal = () => {
    setShowForm(false);
    setViewingRecord(null);
    resetForm();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading medical records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="medical-records">
        <div className="page-header">
          <h2>Medical Records Management</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <span>➕</span>
            Create New Record
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <div className="patient-selector">
          <label htmlFor="patientSelect">
            <span>👤</span>
            Select Patient:
          </label>
          <select
            id="patientSelect"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">Choose a patient</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.name} (DOB: {new Date(patient.dob).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editingRecord ? 'Edit Medical Record' : 'Create Medical Record'}</h3>
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
                    disabled={!!editingRecord}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <span>🤒</span>
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Describe the patient's symptoms, duration, and severity..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    <span>🔍</span>
                    Diagnosis
                  </label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter diagnosis and clinical findings..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    <span>💊</span>
                    Prescription
                  </label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter prescribed medications, dosage, and instructions..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    <span>🧪</span>
                    Tests Ordered
                  </label>
                  <input
                    type="text"
                    name="testsOrdered"
                    value={formData.testsOrdered}
                    onChange={handleChange}
                    placeholder="e.g., Blood test, X-ray, MRI, Ultrasound..."
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <span>{editingRecord ? '📝' : '💾'}</span>
                    {editingRecord ? 'Update Record' : 'Save Record'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingRecord && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Medical Record Details</h3>
              <div className="record-details-view">
                <div className="detail-row">
                  <label>
                    <span>👤</span>
                    Patient:
                  </label>
                  <span>{viewingRecord.patient?.name}</span>
                </div>
                <div className="detail-row">
                  <label>
                    <span>📅</span>
                    Date:
                  </label>
                  <span>{new Date(viewingRecord.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <label>
                    <span>👨‍⚕️</span>
                    Doctor:
                  </label>
                  <span>{viewingRecord.doctor?.name}</span>
                </div>
                <div className="detail-row">
                  <label>
                    <span>🤒</span>
                    Symptoms:
                  </label>
                  <span>{viewingRecord.symptoms}</span>
                </div>
                {viewingRecord.diagnosis && (
                  <div className="detail-row">
                    <label>
                      <span>🔍</span>
                      Diagnosis:
                    </label>
                    <span>{viewingRecord.diagnosis}</span>
                  </div>
                )}
                {viewingRecord.prescription && (
                  <div className="detail-row">
                    <label>
                      <span>💊</span>
                      Prescription:
                    </label>
                    <span>{viewingRecord.prescription}</span>
                  </div>
                )}
                {viewingRecord.testsOrdered && (
                  <div className="detail-row">
                    <label>
                      <span>🧪</span>
                      Tests Ordered:
                    </label>
                    <span>{viewingRecord.testsOrdered}</span>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setViewingRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedPatient && (
          <div className="records-list">
            <h3>Medical Records</h3>
            {records.length === 0 ? (
              <div className="empty-state">
                <p>No medical records found for this patient.</p>
              </div>
            ) : (
              <div className="records-container">
                {records.map(record => (
                  <div key={record._id} className="record-card">
                    <div className="record-header">
                      <h4>
                        <span>📅</span>
                        {new Date(record.createdAt).toLocaleDateString()}
                      </h4>
                      <div className="record-actions">
                        <span>
                          <span>👨‍⚕️</span>
                          Dr. {record.doctor?.name}
                        </span>
                        <div>
                          <button 
                            className="btn-sm btn-view"
                            onClick={() => handleView(record)}
                          >
                            <span>👁️</span>
                            View
                          </button>
                          <button 
                            className="btn-sm btn-edit"
                            onClick={() => handleEdit(record)}
                          >
                            <span>✏️</span>
                            Edit
                          </button>
                          <button 
                            className="btn-sm btn-delete"
                            onClick={() => handleDelete(record._id)}
                          >
                            <span>🗑️</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="record-details">
                      <div className="detail-group">
                        <label>
                          <span>🤒</span>
                          Symptoms:
                        </label>
                        <p>{record.symptoms}</p>
                      </div>
                      {record.diagnosis && (
                        <div className="detail-group">
                          <label>
                            <span>🔍</span>
                            Diagnosis:
                          </label>
                          <p>{record.diagnosis}</p>
                        </div>
                      )}
                      {record.prescription && (
                        <div className="detail-group">
                          <label>
                            <span>💊</span>
                            Prescription:
                          </label>
                          <p>{record.prescription}</p>
                        </div>
                      )}
                      {record.testsOrdered && (
                        <div className="detail-group">
                          <label>
                            <span>🧪</span>
                            Tests Ordered:
                          </label>
                          <p>{record.testsOrdered}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MedicalRecords;