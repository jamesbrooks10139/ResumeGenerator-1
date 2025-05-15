import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import LoginPage from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import ForgotPasswordPage from './components/auth/ForgotPassword';
import ResetPasswordPage from './components/auth/ResetPassword';
import ProfilePage from './components/profile/Profile';
import ResumePreview from './pages/ResumePreview';
import ResumeEditor from './components/ResumeEditor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/preview" element={<ResumePreview />} />
            <Route 
              path="/editor" 
              element={
                <ProtectedRoute>
                  <ResumeEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 