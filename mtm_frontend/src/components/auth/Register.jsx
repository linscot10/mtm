import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    dob: '',
    gender: '',
    contact: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    
    // Check for strong password criteria
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
      return 'strong';
    }
    return 'medium';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    
    // Validate patient-specific fields if role is patient
    if (formData.role === 'patient') {
      if (!formData.dob) return setError('Date of birth is required for patients');
      if (!formData.gender) return setError('Gender is required for patients');
      if (!formData.contact) return setError('Contact information is required for patients');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Prepare user data for registration
      const { confirmPassword, dob, gender, contact, address, ...userData } = formData;
      
      // Include patient details if role is patient
      if (formData.role === 'patient') {
        userData.patientDetails = { dob, gender, contact, address };
      }
      
      const result = await register(userData);
      
      if (result.success) {
        navigate('/login', { 
          state: { 
            message: formData.role === 'patient' 
              ? 'Registration successful! Please log in to complete your profile.' 
              : 'Registration successful! Please log in.'
          }
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create an account. Please try again.');
    }
    setLoading(false);
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isPatient = formData.role === 'patient';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Healthcare System Registration</h2>
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <i className="fas fa-user"></i> Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">
              <i className="fas fa-user-tag"></i> Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="role-select"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="lab">Lab Technician</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>

          {/* Patient-specific fields */}
          {isPatient && (
            <>
              <div className="form-group">
                <label htmlFor="dob">
                  <i className="fas fa-calendar"></i> Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required={isPatient}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  <i className="fas fa-venus-mars"></i> Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required={isPatient}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact">
                  <i className="fas fa-phone"></i> Contact Number
                </label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required={isPatient}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <i className="fas fa-home"></i> Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  rows="3"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a strong password (min. 6 characters)"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.password && (
              <div className={`password-strength ${passwordStrength}`}>
                <span>Password strength: </span>
                <span className="strength-text">
                  {passwordStrength === 'weak' && 'Weak - Add more characters'}
                  {passwordStrength === 'medium' && 'Medium - Add uppercase, numbers, or symbols'}
                  {passwordStrength === 'strong' && 'Strong - Good job!'}
                </span>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="fas fa-lock"></i> Confirm Password
            </label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="auth-button">
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Register
              </>
            )}
          </button>
        </form>
        
        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>

        <div className="privacy-notice">
          <p>
            <i className="fas fa-shield-alt"></i> Your information is protected and 
            will only be used for healthcare purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;