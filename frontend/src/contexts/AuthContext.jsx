import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:3030/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to fetch user profile');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post('http://localhost:3030/api/auth/login', {
        email,
        password,
        rememberMe
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      await fetchUserProfile(token);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:3030/api/auth/register', userData);
      const { token, requiresVerification } = response.data;
      localStorage.setItem('token', token);
      setRequiresVerification(requiresVerification);
      await fetchUserProfile(token);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to register');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    setRequiresVerification(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3030/api/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUserProfile(token);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
      return false;
    }
  };

  const verifyEmail = async (token) => {
    try {
      await axios.get(`http://localhost:3030/api/auth/verify-email?token=${token}`);
      setRequiresVerification(false);
      return true;
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err.response?.data?.error || 'Failed to verify email');
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post('http://localhost:3030/api/auth/forgot-password', { email });
      return true;
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.error || 'Failed to process password reset request');
      return false;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await axios.post('http://localhost:3030/api/auth/reset-password', {
        token,
        newPassword
      });
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    requiresVerification,
    login,
    register,
    logout,
    updateProfile,
    verifyEmail,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 