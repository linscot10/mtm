import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { vitalsService, patientService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './VitalsManagement.css';

const VitalsManagement = () => {
  const [vitals, setVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    height: '',
    weight: '',
    painLevel: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPatients();
    fetchVitals();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (err) {
      setError('Failed to fetch patients');
    }
  };

  const fetchVitals = async () => {
    try {
      const response = await vitalsService.getAll();
      setVitals(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch vitals records');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (bloodPressure.systolic, bloodPressure.diastolic)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patientId) {
      return setError('Please select a patient');
    }
    
    // Validate vital signs ranges
    const errors = [];
    
    if (formData.bloodPressure.systolic) {
      const systolic = parseInt(formData.bloodPressure.systolic);
      if (systolic < 50 || systolic > 250) {
        errors.push('Systolic BP must be between 50-250 mmHg');
      }
    }
    
    if (formData.bloodPressure.diastolic) {
      const diastolic = parseInt(formData.bloodPressure.diastolic);
      if (diastolic < 30 || diastolic > 150) {
        errors.push('Diastolic BP must be between 30-150 mmHg');
      }
    }
    
    if (formData.heartRate && (formData.heartRate < 30 || formData.heartRate > 250)) {
      errors.push('Heart rate must be between 30-250 BPM');
    }
    
    if (formData.respiratoryRate && (formData.respiratoryRate < 8 || formData.respiratoryRate > 60)) {
      errors.push('Respiratory rate must be between 8-60 breaths/min');
    }
    
    if (formData.temperature && (formData.temperature < 30 || formData.temperature > 45)) {
      errors.push('Temperature must be between 30-45°C');
    }
    
    if (errors.length > 0) {
      return setError(errors.join(', '));
    }
    
    try {
      await vitalsService.create(formData);
      setShowForm(false);
      resetForm();
      fetchVitals();
      setError('');
    } catch (err) {
      setError('Failed to save vitals record',err);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: '',
      height: '',
      weight: '',
      painLevel: '',
      notes: ''
    });
  };

  const getStatusBadge = (vitalsRecord) => {
    if (vitalsRecord.isCritical) {
      return <span className="status-badge critical">CRITICAL</span>;
    }
    if (vitalsRecord.requiresAttention) {
      return <span className="status-badge attention">ATTENTION NEEDED</span>;
    }
    return <span className="status-badge normal">NORMAL</span>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">Loading vitals records...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="vitals-management">
        <div className="page-header">
          <h2>Vital Signs Management</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus"></i> Record New Vitals
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {/* Quick Stats */}
        <div className="vitals-stats">
          <div className="stat-card">
            <h3>Records Today</h3>
            <p className="stat-number">{vitals.filter(v => {
              const today = new Date();
              const recordDate = new Date(v.recordedAt);
              return recordDate.toDateString() === today.toDateString();
            }).length}</p>
          </div>
          <div className="stat-card">
            <h3>Critical</h3>
            <p className="stat-number critical">{vitals.filter(v => v.isCritical).length}</p>
          </div>
          <div className="stat-card">
            <h3>Needs Attention</h3>
            <p className="stat-number attention">{vitals.filter(v => v.requiresAttention).length}</p>
          </div>
        </div>

        {/* Record Vitals Form Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal vitals-modal">
              <h3>Record Vital Signs</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Patient</label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} ({patient.gender}, {new Date(patient.dob).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vitals-grid">
                  {/* Blood Pressure */}
                  <div className="form-group">
                    <label>Blood Pressure (mmHg)</label>
                    <div className="bp-inputs">
                      <input
                        type="number"
                        name="bloodPressure.systolic"
                        value={formData.bloodPressure.systolic}
                        onChange={handleChange}
                        placeholder="Systolic"
                        min="50"
                        max="250"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        name="bloodPressure.diastolic"
                        value={formData.bloodPressure.diastolic}
                        onChange={handleChange}
                        placeholder="Diastolic"
                        min="30"
                        max="150"
                      />
                    </div>
                  </div>

                  {/* Heart Rate */}
                  <div className="form-group">
                    <label>Heart Rate (BPM)</label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      min="30"
                      max="250"
                    />
                  </div>

                  {/* Respiratory Rate */}
                  <div className="form-group">
                    <label>Respiratory Rate (breaths/min)</label>
                    <input
                      type="number"
                      name="respiratoryRate"
                      value={formData.respiratoryRate}
                      onChange={handleChange}
                      min="8"
                      max="60"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="form-group">
                    <label>Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      min="30"
                      max="45"
                    />
                  </div>

                  {/* Oxygen Saturation */}
                  <div className="form-group">
                    <label>Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={formData.oxygenSaturation}
                      onChange={handleChange}
                      min="50"
                      max="100"
                    />
                  </div>

                  {/* Height & Weight */}
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      min="50"
                      max="250"
                    />
                  </div>

                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="2"
                      max="300"
                    />
                  </div>

                  {/* BMI Display */}
                  {formData.height && formData.weight && (
                    <div className="form-group">
                      <label>Calculated BMI</label>
                      <div className="bmi-display">
                        {((formData.weight / ((formData.height / 100) ** 2)).toFixed(2))}
                        {formData.bmi > 30 && <span className="bmi-warning"> (Obese)</span>}
                        {formData.bmi > 25 && formData.bmi <= 30 && <span className="bmi-warning"> (Overweight)</span>}
                        {formData.bmi >= 18.5 && formData.bmi <= 25 && <span className="bmi-normal"> (Normal)</span>}
                        {formData.bmi < 18.5 && <span className="bmi-warning"> (Underweight)</span>}
                      </div>
                    </div>
                  )}

                  {/* Pain Level */}
                  <div className="form-group">
                    <label>Pain Level (0-10)</label>
                    <div className="pain-scale">
                      <input
                        type="range"
                        name="painLevel"
                        value={formData.painLevel}
                        onChange={handleChange}
                        min="0"
                        max="10"
                      />
                      <div className="pain-labels">
                        <span>0</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                        <span>10</span>
                      </div>
                      <div className="pain-description">
                        {formData.painLevel >= 8 && 'Severe Pain'}
                        {formData.painLevel >= 5 && formData.painLevel < 8 && 'Moderate Pain'}
                        {formData.painLevel >= 1 && formData.painLevel < 5 && 'Mild Pain'}
                        {formData.painLevel == 0 && 'No Pain'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional observations or comments..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-save"></i> Save Vitals
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vitals Records Table */}
        <div className="vitals-table">
          <h3>Recent Vital Signs Records</h3>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>BP</th>
                <th>HR</th>
                <th>RR</th>
                <th>Temp</th>
                <th>SpO₂</th>
                <th>Status</th>
                <th>Recorded By</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map(vitals => (
                <tr key={vitals._id} className={vitals.isCritical ? 'critical-row' : vitals.requiresAttention ? 'attention-row' : ''}>
                  <td>{vitals.patient?.name}</td>
                  <td>
                    {vitals.bloodPressure?.systolic && vitals.bloodPressure?.diastolic 
                      ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`
                      : 'N/A'
                    }
                  </td>
                  <td>{vitals.heartRate || 'N/A'}</td>
                  <td>{vitals.respiratoryRate || 'N/A'}</td>
                  <td>{vitals.temperature ? `${vitals.temperature}°C` : 'N/A'}</td>
                  <td>{vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : 'N/A'}</td>
                  <td>{getStatusBadge(vitals)}</td>
                  <td>{vitals.recordedBy?.name}</td>
                  <td>{new Date(vitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {vitals.length === 0 && (
            <div className="empty-state">
              <p>No vitals records found. Record the first vitals for a patient.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VitalsManagement;