import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  Flex,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import EducationForm from '../EducationForm';

const EducationHistory = ({ education, onUpdate }) => {
  const [editingEducation, setEditingEducation] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleAddEducation = async (educationData) => {
    try {
      const response = await fetch('http://localhost:3030/api/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(educationData)
      });

      if (!response.ok) {
        throw new Error('Failed to add education');
      }

      onUpdate();
      onClose();
      toast({
        title: 'Education added',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error adding education:', error);
      toast({
        title: 'Error',
        description: 'Failed to add education',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleUpdateEducation = async (id, educationData) => {
    try {
      const response = await fetch(`http://localhost:3030/api/education/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(educationData)
      });

      if (!response.ok) {
        throw new Error('Failed to update education');
      }

      onUpdate();
      setEditingEducation(null);
      toast({
        title: 'Education updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error updating education:', error);
      toast({
        title: 'Error',
        description: 'Failed to update education',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3030/api/education/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete education');
      }

      onUpdate();
      toast({
        title: 'Education deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error deleting education:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete education',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Education</Heading>
        <Button colorScheme="blue" onClick={onOpen}>
          Add Education
        </Button>
      </Flex>

      <VStack spacing={4} align="stretch">
        {education.map((edu) => (
          <Box
            key={edu.id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            position="relative"
          >
            <Flex justify="space-between" align="start">
              <VStack align="start" spacing={2}>
                <Heading size="md">{edu.school_name}</Heading>
                <Text color="gray.600">{edu.location}</Text>
                <Text>{edu.degree} in {edu.field_of_study}</Text>
                <Text color="gray.600">
                  {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                </Text>
                {edu.gpa && <Text color="gray.600">GPA: {edu.gpa}</Text>}
                {edu.description && (
                  <Text mt={2}>{edu.description}</Text>
                )}
              </VStack>
              <Flex>
                <IconButton
                  icon={<EditIcon />}
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setEditingEducation(edu)}
                  aria-label="Edit education"
                />
                <IconButton
                  icon={<DeleteIcon />}
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDeleteEducation(edu.id)}
                  aria-label="Delete education"
                />
              </Flex>
            </Flex>
          </Box>
        ))}
      </VStack>

      {/* Add Education Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Education</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <EducationForm
              onSubmit={handleAddEducation}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Education Modal */}
      <Modal
        isOpen={!!editingEducation}
        onClose={() => setEditingEducation(null)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Education</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {editingEducation && (
              <EducationForm
                education={editingEducation}
                onSubmit={(data) => handleUpdateEducation(editingEducation.id, data)}
                onCancel={() => setEditingEducation(null)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EducationHistory; 