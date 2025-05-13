import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  useToast,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { renderAsync } from 'docx-preview';

function ResumePreview() {
  const [resume, setResume] = useState(null);
  const [docxContent, setDocxContent] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const savedResume = localStorage.getItem('generatedResume');
    if (!savedResume) {
      navigate('/');
      return;
    }
    const parsedResume = JSON.parse(savedResume);
    setResume(parsedResume.resume);
    setDocxContent(parsedResume.docxContent);
  }, [navigate]);

  useEffect(() => {
    if (docxContent) {
      const container = document.getElementById('docx-container');
      if (container) {
        // Convert base64 to blob
        const byteString = atob(docxContent);
        const mimeString = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        
        // Render the docx
        renderAsync(blob, container, container, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          useMathMLPolyfill: true,
          renderEndnotes: true,
          renderFootnotes: true,
          renderFooters: true,
          renderHeaders: true,
          title: 'Resume Preview',
        }).catch(error => {
          console.error('Error rendering docx:', error);
          toast({
            title: 'Error',
            description: 'Failed to render document preview',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
      }
    }
  }, [docxContent, toast]);

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
    try {
      // Convert base64 to blob
      const byteString = atob(docxContent);
      const mimeString = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download DOCX',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
          height="800px"
          overflow="auto"
        >
          <div id="docx-container" style={{ width: '100%', height: '100%' }} />
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