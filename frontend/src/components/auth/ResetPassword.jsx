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
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await resetPassword(token, password);
      if (success) {
        setIsSuccess(true);
        toast({
          title: 'Password reset successful',
          status: 'success',
          duration: 3000,
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

  if (!token) {
    return (
      <Container maxW="container.sm" py={10}>
        <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Alert status="error">
              <AlertIcon />
              Invalid or missing reset token
            </Alert>
            <Text textAlign="center">
              <Link as={RouterLink} to="/forgot-password" color="blue.500">
                Request a new reset link
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  if (isSuccess) {
    return (
      <Container maxW="container.sm" py={10}>
        <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Alert status="success">
              <AlertIcon />
              Your password has been reset successfully
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
          <Heading textAlign="center">Reset Password</Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default ResetPassword; 