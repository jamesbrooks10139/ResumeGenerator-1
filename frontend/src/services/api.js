import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const resumeService = {
  generateResume: (jobDescription) => 
    api.post('/api/generate-resume', { jobDescription }),
  
  saveResume: (resumeData) => 
    api.post('/api/save-resume', resumeData),
  
  getResume: (id) => 
    api.get(`/api/resume/${id}`),
  
  downloadResume: (id) => 
    api.get(`/api/resume/${id}/download`, { responseType: 'blob' })
};

export const authService = {
  login: (credentials) => 
    api.post('/api/auth/login', credentials),
  
  register: (userData) => 
    api.post('/api/auth/register', userData),
  
  forgotPassword: (email) => 
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token, newPassword) => 
    api.post('/api/auth/reset-password', { token, newPassword }),
  
  verifyEmail: (token) => 
    api.get(`/api/auth/verify-email?token=${token}`)
};

export const profileService = {
  getProfile: () => 
    api.get('/api/profile'),
  
  updateProfile: (profileData) => 
    api.put('/api/profile', profileData),
  
  getEmploymentHistory: () => 
    api.get('/api/profile/employment'),
  
  getEducation: () => 
    api.get('/api/profile/education'),

  addEducation: (educationData) =>
    api.post('/api/education', educationData),

  updateEducation: (id, educationData) =>
    api.put(`/api/education/${id}`, educationData),

  deleteEducation: (id) =>
    api.delete(`/api/education/${id}`)
};

export const employmentService = {
  addEmployment: (employmentData) => 
    api.post('/api/employment', employmentData),
  
  updateEmployment: (id, employmentData) => 
    api.put(`/api/employment/${id}`, employmentData),
  
  deleteEmployment: (id) => 
    api.delete(`/api/employment/${id}`)
};

export const qaService = {
  askQuestion: (question, jobDescription) =>
    api.post('/api/ask-question', { question, jobDescription })
};

export default api; 