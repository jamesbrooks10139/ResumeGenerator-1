import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Stack, Divider, useMediaQuery, IconButton, Fab, Drawer
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { qaService } from '../services/api';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const SidebarQA = ({ jobDescription }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await qaService.askQuestion(question, jobDescription);
      setAnswer(res.data.answer || 'No answer received.');
    } catch (err) {
      setAnswer('Failed to get answer.');
    }
    setLoading(false);
  };

  // Drawer width
  const drawerWidth = 370;

  return (
    <>
      {/* Floating FAB to open the drawer */}
      {!open && (
        <Fab
          color="primary"
          aria-label="Ask about the job"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 32,
            zIndex: 1301,
            boxShadow: 6
          }}
        >
          <QuestionAnswerIcon />
        </Fab>
      )}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100vw' : drawerWidth,
            height: isMobile ? '50vh' : '100vh',
            p: 0,
            bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e3e8ee 100%)',
            borderTopLeftRadius: isMobile ? 3 : 0,
            borderTopRightRadius: isMobile ? 3 : 0,
            boxShadow: 6,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Ask about the Job
          </Typography>
          <IconButton onClick={() => setOpen(false)}>
            {isMobile ? <ExpandLessIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, height: '100%' }}>
          <Stack spacing={2} flex={1}>
            <TextField
              label="Your Question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              variant="outlined"
            />
            <Button variant="contained" onClick={handleAsk} disabled={loading || !question.trim()} size="large" sx={{ fontWeight: 600 }}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            <Divider sx={{ my: 1 }} />
            <Box flex={1} mt={2} sx={{
              overflowY: 'auto',
              bgcolor: '#f1f5f9',
              p: 2,
              borderRadius: 2,
              minHeight: 120,
              border: '1px solid #e0e0e0',
            }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Answer:</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontSize: 16 }}>{answer}</Typography>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default SidebarQA; 