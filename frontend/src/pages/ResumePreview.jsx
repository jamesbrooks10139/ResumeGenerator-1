import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  Text,
  useToast,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

function ResumePreview() {
  const [resume, setResume] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const savedResume = localStorage.getItem('generatedResume');
    if (!savedResume) {
      navigate('/');
      return;
    }
    setResume(savedResume);
  }, [navigate]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const lines = resume.split('\n');
      let y = 20;
      const lineHeight = 7;

      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      });

      doc.save('resume.pdf');
      toast({
        title: 'Success',
        description: 'Resume downloaded as PDF',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDownloadDOCX = () => {
    // For DOCX, we'll create a simple text file for now
    // In a production environment, you'd want to use a proper DOCX library
    const blob = new Blob([resume], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.docx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Success',
      description: 'Resume downloaded as DOCX',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Your Generated Resume
          </Heading>
        </Box>

        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          boxShadow="md"
          whiteSpace="pre-wrap"
        >
          <Text>{resume}</Text>
        </Box>

        <HStack spacing={4} justify="center">
          <Button
            leftIcon={<Icon as={FaFilePdf} />}
            colorScheme="red"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button
            leftIcon={<Icon as={FaFileWord} />}
            colorScheme="blue"
            onClick={handleDownloadDOCX}
          >
            Download DOCX
          </Button>
        </HStack>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
        >
          Generate Another Resume
        </Button>
      </VStack>
    </Container>
  );
}

export default ResumePreview; 