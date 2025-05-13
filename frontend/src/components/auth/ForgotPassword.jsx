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
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await forgotPassword(email);
      if (success) {
        setIsSubmitted(true);
        toast({
          title: 'Reset link sent',
          description: 'If your email is registered, you will receive a password reset link.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Container maxW="container.sm" py={10}>
        <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Alert status="success">
              <AlertIcon />
              If your email is registered, you will receive a password reset link.
            </Alert>
            <Text textAlign="center">
              <Link as={RouterLink} to="/login" color="blue.500">
                Return to login
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="stretch">
          <Heading textAlign="center">Forgot Password</Heading>
          <Text textAlign="center" color="gray.600">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </VStack>
          </form>
          <Text textAlign="center">
            Remember your password?{' '}
            <Link as={RouterLink} to="/login" color="blue.500">
              Login here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 