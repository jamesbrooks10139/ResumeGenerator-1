import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  IconButton,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PictureAsPdf as PdfIcon, Description as DocIcon } from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';

function ResumePreview() {
  const [resume, setResume] = useState(null);
  const [docxContent, setDocxContent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    const savedResume = localStorage.getItem('generatedResume');
    if (!savedResume) {
      navigate('/');
      return;
    }
    try {
      const parsedResume = JSON.parse(savedResume);
      setResume(parsedResume.resume);
      setDocxContent(parsedResume.docxContent);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to load resume data. Please try generating a new resume.',
        severity: 'error'
      });
      setTimeout(() => navigate('/'), 3000);
    }
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
          setSnackbar({
            open: true,
            message: 'Failed to render document preview',
            severity: 'error'
          });
        });
      }
    }
  }, [docxContent]);

  const handleDownloadPDF = () => {
    if (!docxContent) return;

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

      // Create a temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.padding = '20mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.height = 'auto';
      tempContainer.style.overflow = 'visible';
      document.body.appendChild(tempContainer);

      // Create a wrapper div for the docx content
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      tempContainer.appendChild(wrapper);

      // Render the docx
      renderAsync(blob, wrapper, wrapper, {
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
      }).then(async () => {
        try {
          // Wait for images to load
          await Promise.all(
            Array.from(tempContainer.getElementsByTagName('img')).map(
              img => new Promise((resolve) => {
                if (img.complete) {
                  resolve();
                } else {
                  img.onload = resolve;
                  img.onerror = resolve;
                }
              })
            )
          );

          // Get all pages
          const pages = tempContainer.querySelectorAll('.page');
          if (!pages.length) {
            console.error('Container content:', tempContainer.innerHTML);
            throw new Error('No pages found in the document');
          }

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // Process each page
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            // Add new page for all pages except the first one
            if (i > 0) {
              pdf.addPage();
            }

            // Make sure the page is visible for capture
            page.style.visibility = 'visible';
            page.style.position = 'relative';
            page.style.left = '0';
            page.style.top = '0';
            page.style.width = '210mm';
            page.style.height = '297mm';
            page.style.margin = '0';
            page.style.padding = '0';
            page.style.backgroundColor = 'white';

            // Convert page to canvas with higher quality
            const canvas = await html2canvas(page, {
              scale: 2,
              useCORS: true,
              logging: true, // Enable logging for debugging
              allowTaint: true,
              backgroundColor: '#ffffff',
              windowWidth: page.scrollWidth,
              windowHeight: page.scrollHeight,
              onclone: (clonedDoc) => {
                const clonedPage = clonedDoc.querySelector('.page');
                if (clonedPage) {
                  clonedPage.style.transform = 'none';
                  clonedPage.style.width = '210mm';
                  clonedPage.style.height = '297mm';
                  clonedPage.style.margin = '0';
                  clonedPage.style.padding = '0';
                }
              }
            });

            // Calculate dimensions to fit the page
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the image to the PDF
            pdf.addImage(
              canvas.toDataURL('image/png', 1.0),
              'PNG',
              0,
              0,
              imgWidth,
              imgHeight
            );

            // Hide the page again
            page.style.visibility = 'hidden';
          }

          // Save the PDF
          pdf.save('resume.pdf');

          // Clean up
          document.body.removeChild(tempContainer);

          setSnackbar({
            open: true,
            message: 'Resume downloaded as PDF',
            severity: 'success'
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          console.error('Container content:', tempContainer.innerHTML);
          setSnackbar({
            open: true,
            message: 'Failed to generate PDF',
            severity: 'error'
          });
          document.body.removeChild(tempContainer);
        }
      }).catch(error => {
        console.error('Error rendering docx:', error);
        console.error('Container content:', tempContainer.innerHTML);
        setSnackbar({
          open: true,
          message: 'Failed to render document',
          severity: 'error'
        });
        document.body.removeChild(tempContainer);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF',
        severity: 'error'
      });
    }
  };

  const handleDownloadDOCX = () => {
    if (!docxContent) return;

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

      setSnackbar({
        open: true,
        message: 'Resume downloaded as DOCX',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download DOCX',
        severity: 'error'
      });
    }
  };

  if (!resume) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography>Loading resume data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom>
            Your Generated Resume
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            height: '800px',
            overflow: 'auto',
            bgcolor: 'background.paper'
          }}
        >
          <div id="docx-container" style={{ width: '100%', height: '100%' }} />
        </Paper>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="error"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DocIcon />}
            onClick={handleDownloadDOCX}
          >
            Download DOCX
          </Button>
        </Stack>

        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Generate Another Resume
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ResumePreview; 