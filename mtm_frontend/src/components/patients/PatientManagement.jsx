import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { patientService } from '../../services/api';
import './PatientManagement.css';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    contact: '',
    address: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch patients');
      setLoading(false);
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
      if (editingPatient) {
        await patientService.update(editingPatient._id, formData);
        setEditingPatient(null);
      } else {
        await patientService.create(formData);
      }
      setShowForm(false);
      resetForm();
      fetchPatients();
    } catch (err) {
      setError('Failed to save patient');
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      dob: patient.dob.split('T')[0], // Format date for input
      gender: patient.gender,
      contact: patient.contact,
      address: patient.address
    });
    setShowForm(true);
  };

  const handleView = (patient) => {
    setViewingPatient(patient);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientService.delete(id);
        fetchPatients();
      } catch (err) {
        setError('Failed to delete patient');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dob: '',
      gender: '',
      contact: '',
      address: ''
    });
    setEditingPatient(null);
  };

  const closeModal = () => {
    setShowForm(false);
    setViewingPatient(null);
    resetForm();
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="patient-management">
        <div className="page-header">
          <h2>Patient Management</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add New Patient
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingPatient ? 'Update' : 'Save'}
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

        {viewingPatient && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Patient Details</h3>
              <div className="patient-details">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{viewingPatient.name}</span>
                </div>
                <div className="detail-row">
                  <label>Date of Birth:</label>
                  <span>{new Date(viewingPatient.dob).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <label>Gender:</label>
                  <span>{viewingPatient.gender}</span>
                </div>
                <div className="detail-row">
                  <label>Contact:</label>
                  <span>{viewingPatient.contact}</span>
                </div>
                <div className="detail-row">
                  <label>Address:</label>
                  <span>{viewingPatient.address}</span>
                </div>
                <div className="detail-row">
                  <label>Created By:</label>
                  <span>{viewingPatient.createdBy?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Created On:</label>
                  <span>{new Date(viewingPatient.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setViewingPatient(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="patients-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient._id}>
                  <td>{patient.name}</td>
                  <td>{new Date(patient.dob).toLocaleDateString()}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.contact}</td>
                  <td>
                    <button 
                      className="btn-sm btn-view"
                      onClick={() => handleView(patient)}
                    >
                      View
                    </button>
                    <button 
                      className="btn-sm btn-edit"
                      onClick={() => handleEdit(patient)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-sm btn-delete"
                      onClick={() => handleDelete(patient._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && (
            <p className="no-patients">No patients found. Add a new patient to get started.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PatientManagement;