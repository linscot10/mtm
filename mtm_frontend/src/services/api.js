import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  registerWithPatient: (userData) => api.post('/auth/register-with-patient', userData),
  getDoctors: () => api.get('/auth/doctors'), // ADDED: Get doctors from auth route
};

export const patientService = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (patientData) => api.post('/patients', patientData),
  update: (id, patientData) => api.put(`/patients/${id}`, patientData),
  updateByUser: (userId, patientData) => api.put(`/patients/user/${userId}`, patientData),
  delete: (id) => api.delete(`/patients/${id}`),
};

export const medicalRecordService = {
  getAllByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  getById: (id) => api.get(`/medical-records/${id}`),
  create: (recordData) => api.post('/medical-records', recordData),
  update: (id, recordData) => api.put(`/medical-records/${id}`, recordData),
  delete: (id) => api.delete(`/medical-records/${id}`),
  getAll: () => api.get('/medical-records'),
};

export const labService = {
  getOrders: () => api.get('/lab-results/orders'),
  getByMedicalRecord: (medicalRecordId) => api.get(`/lab-results/${medicalRecordId}`),
  create: (resultData) => api.post('/lab-results', resultData),
};

export const prescriptionService = {
  getAll: () => api.get('/prescriptions'),
  create: (prescriptionData) => api.post('/prescriptions', prescriptionData),
  administer: (id) => api.put(`/prescriptions/${id}/administer`),
};

export const dashboardService = {
  getStats: (role) => api.get(`/dashboard/stats?role=${role}`),
};

export const vitalsService = {
  getAll: () => api.get('/vitals'),
  getByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  getLatestByPatient: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),
  create: (vitalsData) => api.post('/vitals', vitalsData),
  update: (id, vitalsData) => api.put(`/vitals/${id}`, vitalsData),
  delete: (id) => api.delete(`/vitals/${id}`),
  getAttentionRequired: () => api.get('/vitals/attention-required'),
  getCritical: () => api.get('/vitals/critical'),
  getStats: () => api.get('/vitals/stats'),
};

export const appointmentService = {
  // Get appointments
  getAll: (params = {}) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getUpcoming: () => api.get('/appointments/upcoming'),
  getById: (id) => api.get(`/appointments/${id}`),
  
  // Create, update, delete
  create: (appointmentData) => api.post('/appointments', appointmentData),
  update: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/appointments/${id}`),
  
  // Availability
  getAvailability: (doctorId, date) => api.get(`/appointments/availability/${doctorId}`, { params: { date } }),
  
  // Statistics
  getStats: () => api.get('/appointments/stats/overview'),
  
  // Get doctors list - CORRECTED: Use /appointments/doctors OR /auth/doctors
  // Option 1: Use appointments route (if you have it there)
  getDoctors: () => api.get('/appointments/doctors'),
  
  // Option 2: Use auth route (if you add it to auth.js)
  // getDoctors: () => api.get('/auth/doctors'),
};



export default api;