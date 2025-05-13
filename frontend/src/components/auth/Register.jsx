import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Link,
  Container,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    personal_email: '',
    linkedin_url: '',
    github_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const success = await register(registrationData);
      if (success) {
        toast({
          title: 'Registration successful',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        navigate('/profile'); // Redirect to profile page after successful registration
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="stretch">
          <Heading textAlign="center">Register</Heading>
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
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </FormControl>
                </GridItem>
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                    />
                  </FormControl>
                </GridItem>
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                    />
                  </FormControl>
                </GridItem>
                <GridItem colSpan={2}>
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
                <GridItem colSpan={2}>
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
                <GridItem colSpan={2}>
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
                <GridItem colSpan={2}>
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
                Register
              </Button>
            </VStack>
          </form>
          <Text textAlign="center">
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="blue.500">
              Login here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register; 