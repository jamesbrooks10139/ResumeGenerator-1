import React from 'react';
import {
  Box,
  Flex,
  Button,
  Link,
  Heading,
  useColorModeValue,
  Spacer
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg={bgColor}
      px={4}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Heading size="md">Resume Generator</Heading>
        </Link>

        <Spacer />

        <Flex alignItems="center" gap={4}>
          {user ? (
            <>
              <Link as={RouterLink} to="/profile" color="blue.500">
                Profile
              </Link>
              <Button
                variant="outline"
                colorScheme="blue"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link as={RouterLink} to="/login" color="blue.500">
                Login
              </Link>
              <Link as={RouterLink} to="/register">
                <Button colorScheme="blue">Register</Button>
              </Link>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 