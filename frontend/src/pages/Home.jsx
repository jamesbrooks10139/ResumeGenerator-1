import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Textarea,
  Button,
  VStack,
  useToast,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFromExtension, setIsFromExtension] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

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
      toast({
        title: 'Error',
        description: 'Please enter a job description',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate-resume', {
        jobDescription,
      });

      // Store the generated resume in localStorage
      localStorage.setItem('generatedResume', response.data.resume);
      navigate('/preview');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate resume. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Resume Generator
          </Heading>
          <Text fontSize="lg" color="gray.600">
            {isFromExtension 
              ? "We've detected a job description from your selection. Review and generate your tailored resume."
              : "Paste a job description below to generate a tailored resume"}
          </Text>
        </Box>

        {isFromExtension && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Job Description Detected!</AlertTitle>
              <AlertDescription>
                The job description has been automatically populated from your selection. You can modify it if needed.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          size="lg"
          minH="300px"
          resize="vertical"
        />

        <Button
          colorScheme="brand"
          size="lg"
          onClick={handleGenerateResume}
          isLoading={isLoading}
          loadingText="Generating..."
          spinner={<Spinner />}
        >
          Generate Resume
        </Button>
      </VStack>
    </Container>
  );
}

export default Home; 