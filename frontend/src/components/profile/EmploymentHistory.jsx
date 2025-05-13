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
  Container,
  Grid,
  GridItem,
  IconButton,
  Flex,
  Textarea,
  Checkbox,
  Divider
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import axios from 'axios';

const EmploymentHistory = ({ employmentHistory, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    position: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (currentEntry) {
        await axios.put(
          `http://localhost:3030/api/employment/${currentEntry.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({
          title: 'Employment history updated',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        await axios.post(
          'http://localhost:3030/api/employment',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({
          title: 'Employment history added',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      onUpdate();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save employment history',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleEdit = (entry) => {
    setCurrentEntry(entry);
    setFormData({
      company_name: entry.company_name,
      position: entry.position,
      location: entry.location,
      start_date: entry.start_date,
      end_date: entry.end_date,
      is_current: entry.is_current,
      description: entry.description
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3030/api/employment/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Employment history deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete employment history',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    });
    setCurrentEntry(null);
    setIsEditing(false);
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>
            Employment History
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Company Name</FormLabel>
                    <Input
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Enter company name"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Position</FormLabel>
                    <Input
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Enter your position"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Location</FormLabel>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter location"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>End Date</FormLabel>
                    <Input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      disabled={formData.is_current}
                    />
                  </FormControl>
                </GridItem>
                <GridItem colSpan={2}>
                  <Checkbox
                    name="is_current"
                    isChecked={formData.is_current}
                    onChange={handleChange}
                  >
                    I currently work here
                  </Checkbox>
                </GridItem>
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your responsibilities and achievements"
                      rows={4}
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Flex gap={4} width="100%">
                <Button
                  type="submit"
                  colorScheme="blue"
                  flex={1}
                >
                  {isEditing ? 'Update' : 'Add'} Employment
                </Button>
                {isEditing && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    flex={1}
                  >
                    Cancel
                  </Button>
                )}
              </Flex>
            </VStack>
          </form>
        </Box>

        <Divider />

        <VStack spacing={4} align="stretch">
          {employmentHistory.map((entry) => (
            <Box
              key={entry.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              position="relative"
            >
              <Flex justify="space-between" align="start" mb={2}>
                <Box>
                  <Heading size="md">{entry.position}</Heading>
                  <Text>{entry.company_name}</Text>
                  <Text color="gray.600">
                    {entry.location} • {entry.start_date} - {entry.is_current ? 'Present' : entry.end_date}
                  </Text>
                </Box>
                <Flex gap={2}>
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => handleEdit(entry)}
                    aria-label="Edit entry"
                    size="sm"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete entry"
                    size="sm"
                    colorScheme="red"
                  />
                </Flex>
              </Flex>
              {entry.description && (
                <Text mt={2} color="gray.700">
                  {entry.description}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
};

export default EmploymentHistory; 