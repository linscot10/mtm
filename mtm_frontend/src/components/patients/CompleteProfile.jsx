// src/components/patients/CompleteProfile.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services/api';
import './CompleteProfile.css';

const CompleteProfile = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    dob: '',
    gender: '',
    contact: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Update patient profile
      await patientService.updateByUser(currentUser.id, formData);
      
      setSuccess('Profile updated successfully!');
      setLoading(false);
    } catch (err) {
      setError('Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile">
      <div className="profile-card">
        <h2>Complete Your Profile</h2>
        <p>Please provide your information to complete your patient profile.</p>
        
        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}
        
        <form onSubmit={handleSubmit}>
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
              <option value="other">Other</option>
              <option value="unknown">Prefer not to say</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
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
              rows="3"
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;