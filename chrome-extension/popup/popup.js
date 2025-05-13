document.addEventListener('DOMContentLoaded', () => {
  const jobDescriptionInput = document.getElementById('jobDescription');
  const generateBtn = document.getElementById('generateBtn');
  const resultDiv = document.getElementById('result');
  const resumeContent = document.getElementById('resumeContent');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Check authentication on load
  chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
    if (!response.isAuthenticated) {
      window.location.href = 'login.html';
    }
  });

  // Handle logout
  logoutBtn.addEventListener('mousedown', () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
      if (response.success) {
        window.location.href = 'login.html';
      }
    });
  });

  // Handle resume generation
  generateBtn.addEventListener('mousedown', async () => {
    const jobDescription = jobDescriptionInput.value.trim();
    
    if (!jobDescription) {
      alert('Please enter a job description');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: 'http://localhost:3030/api/generate-resume',
        method: 'POST',
        body: { jobDescription }
      });

      if (response.success) {
        resumeContent.innerHTML = response.data.resume.replace(/\n/g, '<br>');
        resultDiv.style.display = 'block';
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      alert(error.message || 'Failed to generate resume');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Resume!';
    }
  });

  // Handle copy to clipboard
  copyBtn.addEventListener('mousedown', () => {
    const text = resumeContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
      alert('Resume copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy resume');
    });
  });

  // Handle download as PDF
  downloadBtn.addEventListener('mousedown', () => {
    const text = resumeContent.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}); 