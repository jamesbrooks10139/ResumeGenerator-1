import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Container,
  Grid,
  GridItem,
  Divider
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import EmploymentHistory from './EmploymentHistory';
import EducationHistory from './EducationHistory';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    personal_email: '',
    linkedin_url: '',
    github_url: ''
  });
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [education, setEducation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3030/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFormData({
        full_name: data.user.full_name || '',
        phone: data.user.phone || '',
        personal_email: data.user.personal_email || '',
        linkedin_url: data.user.linkedin_url || '',
        github_url: data.user.github_url || ''
      });
      setEmploymentHistory(data.employmentHistory || []);
      setEducation(data.education || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await updateProfile(formData);
      if (success) {
        toast({
          title: 'Profile updated',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>
            Profile Information
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Personal Email</FormLabel>
                    <Input
                      type="email"
                      name="personal_email"
                      value={formData.personal_email}
                      onChange={handleChange}
                      placeholder="Enter your personal email"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <Input
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="Enter your LinkedIn profile URL"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>GitHub URL</FormLabel>
                    <Input
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      placeholder="Enter your GitHub profile URL"
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
              >
                Update Profile
              </Button>
            </VStack>
          </form>
        </Box>

        <Divider />

        <EmploymentHistory
          employmentHistory={employmentHistory}
          onUpdate={fetchProfile}
        />

        <Divider />

        <EducationHistory
          education={education}
          onUpdate={fetchProfile}
        />
      </VStack>
    </Container>
  );
};

export default Profile; 