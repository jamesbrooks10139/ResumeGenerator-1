import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { resumeService } from '../services/api';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check for job description in URL parameters when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jobDescriptionParam = params.get('jobDescription');
    
    if (jobDescriptionParam) {
      const decodedText = decodeURIComponent(jobDescriptionParam);
      setJobDescription(decodedText);
      setIsFromExtension(true);
      
      // Clean up the URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data } = await resumeService.generateResume(jobDescription);
      localStorage.setItem('generatedResume', JSON.stringify({
        ...data,
        jobDescription // Save job description for later use
      }));
      navigate('/preview');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', py: 6 }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: 6, bgcolor: '#fff' }}>
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#222' }}>
                Resume Generator
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {isFromExtension 
                  ? "We've detected a job description from your selection. Review and generate your tailored resume."
                  : "Paste a job description below to generate a tailored resume"}
              </Typography>
            </Box>

            {isFromExtension && (
              <Alert severity="info">
                Job Description Detected! The job description has been automatically populated from your selection. You can modify it if needed.
              </Alert>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              sx={{ bgcolor: '#f9fafb', borderRadius: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGenerateResume}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ fontWeight: 700, minHeight: 48 }}
            >
              {isLoading ? 'Generating...' : 'Generate Resume'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default Home; 