import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Checkbox,
  Button,
  VStack,
  Grid,
  GridItem,
  Flex
} from '@chakra-ui/react';

const EducationForm = ({ education, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    school_name: '',
    location: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    description: ''
  });

  useEffect(() => {
    if (education) {
      setFormData({
        school_name: education.school_name || '',
        location: education.location || '',
        degree: education.degree || '',
        field_of_study: education.field_of_study || '',
        start_date: education.start_date || '',
        end_date: education.end_date || '',
        is_current: education.is_current || false,
        gpa: education.gpa || '',
        description: education.description || ''
      });
    }
  }, [education]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>School Name</FormLabel>
          <Input
            name="school_name"
            value={formData.school_name}
            onChange={handleChange}
            placeholder="Enter school name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Location</FormLabel>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter location"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Degree</FormLabel>
          <Input
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            placeholder="Enter degree"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Field of Study</FormLabel>
          <Input
            name="field_of_study"
            value={formData.field_of_study}
            onChange={handleChange}
            placeholder="Enter field of study"
          />
        </FormControl>

        <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
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
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                isDisabled={formData.is_current}
              />
            </FormControl>
          </GridItem>
        </Grid>

        <FormControl>
          <Checkbox
            name="is_current"
            isChecked={formData.is_current}
            onChange={handleChange}
          >
            Currently Studying
          </Checkbox>
        </FormControl>

        <FormControl>
          <FormLabel>GPA</FormLabel>
          <Input
            name="gpa"
            value={formData.gpa}
            onChange={handleChange}
            placeholder="Enter GPA"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            rows={3}
          />
        </FormControl>

        <Flex justify="flex-end" width="100%" gap={3}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="blue">
            {education ? 'Update' : 'Add'} Education
          </Button>
        </Flex>
      </VStack>
    </form>
  );
};

export default EducationForm; 