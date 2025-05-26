import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Stack } from '@mui/material';
import { qaService } from '../services/api';

const SidebarQA = ({ jobDescription }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <Paper sx={{ width: 350, p: 2, height: '100vh', position: 'fixed', right: 0, top: 0, zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>Ask about the Job</Typography>
      <Stack spacing={2} flex={1}>
        <TextField
          label="Your Question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
        />
        <Button variant="contained" onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? 'Generating...' : 'Generate'}
        </Button>
        <Box flex={1} mt={2} sx={{ overflowY: 'auto', bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Answer:</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{answer}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default SidebarQA; 