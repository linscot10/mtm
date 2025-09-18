import React, { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { labService, medicalRecordService } from '../../services/api';
import './LabResults.css';

const LabResults = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [results, setResults] = useState([]);
  const [showResultForm, setShowResultForm] = useState(false);
  const [formData, setFormData] = useState({
    medicalRecord: '',
    resultDetails: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser.role === 'lab') {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [currentUser.role]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await labService.getOrders();
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch test orders. Please try again.');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (medicalRecordId) => {
    try {
      const response = await labService.getByMedicalRecord(medicalRecordId);
      setResults(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch lab results.');
      console.error('Fetch results error:', err);
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
      await labService.create(formData);
      setShowResultForm(false);
      setFormData({
        medicalRecord: '',
        resultDetails: ''
      });
      if (formData.medicalRecord) {
        fetchResults(formData.medicalRecord);
      }
      setError('');
    } catch (err) {
      setError('Failed to upload lab result. Please try again.');
      console.error('Upload error:', err);
    }
  };

  const handleViewResults = (medicalRecordId) => {
    setSelectedOrder(medicalRecordId);
    fetchResults(medicalRecordId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading lab data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lab-results">
        <div className="page-header">
          <h2>Lab Results Management</h2>
          {currentUser.role === 'lab' && (
            <button 
              className="btn-primary"
              onClick={() => setShowResultForm(true)}
            >
              <span>📤</span>
              Upload New Result
            </button>
          )}
        </div>

        {error && <div className="error-alert">{error}</div>}

        {showResultForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Upload Lab Result</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    <span>📋</span>
                    Medical Record
                  </label>
                  <select
                    name="medicalRecord"
                    value={formData.medicalRecord}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Medical Record</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        {order.patient?.name || 'Unknown Patient'} - {order.testsOrdered}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <span>📝</span>
                    Result Details
                  </label>
                  <textarea
                    name="resultDetails"
                    value={formData.resultDetails}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Enter detailed test results including observations, findings, and recommendations..."
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <span>✅</span>
                    Upload Result
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowResultForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentUser.role === 'lab' ? (
          <div className="orders-section">
            <h3>Test Orders</h3>
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No test orders found.</p>
              </div>
            ) : (
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date of Birth</th>
                      <th>Tests Ordered</th>
                      <th>Ordering Doctor</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id}>
                        <td>
                          <strong>{order.patient?.name || 'Unknown'}</strong>
                        </td>
                        <td>
                          {order.patient?.dob ? new Date(order.patient.dob).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <span className="test-badge">{order.testsOrdered}</span>
                        </td>
                        <td>{order.doctor?.name || 'Unknown'}</td>
                        <td>
                          <button 
                            className="btn-sm"
                            onClick={() => handleViewResults(order._id)}
                          >
                            <span>👁️</span>
                            View Results
                          </button>
                          <button 
                            className="btn-sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                medicalRecord: order._id
                              });
                              setShowResultForm(true);
                            }}
                          >
                            <span>➕</span>
                            Add Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="doctor-view">
            <h3>Lab Results</h3>
            <p>Select a patient to view their lab results.</p>
          </div>
        )}

        {selectedOrder && (
          <div className="results-section">
            <h3>Lab Results for Selected Order</h3>
            {results.length === 0 ? (
              <div className="empty-state">
                <p>No results found for this order.</p>
              </div>
            ) : (
              <div className="results-container">
                {results.map(result => (
                  <div key={result._id} className="result-card">
                    <div className="result-header">
                      <h4>Date: {new Date(result.createdAt).toLocaleDateString()}</h4>
                      <span>Technician: {result.technician?.name || 'Unknown'}</span>
                    </div>
                    <div className="result-details">
                      <label>Result Details:</label>
                      <p>{result.resultDetails}</p>
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

export default LabResults;