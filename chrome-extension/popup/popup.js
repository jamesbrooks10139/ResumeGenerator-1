const backendUrl = 'http://162.218.114.85:3030/api';

document.addEventListener('DOMContentLoaded', async () => {
  const jobDescriptionInput = document.getElementById('jobDescription');
  const generateBtn = document.getElementById('generateBtn');
  const resultDiv = document.getElementById('result');
  const resumeContent = document.getElementById('resumeContent');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginForm = document.getElementById('loginForm');
  const accountInfo = document.getElementById('accountInfo');
  const loginBtn = document.getElementById('loginBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const registerLink = document.getElementById('register');

  // Check if user is logged in
  const token = await new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token);
    });
  });

  if (token) {
    // Show account info
    loginForm.style.display = 'none';
    accountInfo.style.display = 'block';
    
    // Fetch user info
    try {
      const response = await fetch(`${backendUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        document.getElementById('userName').textContent = data.user.full_name;
        document.getElementById('userEmail').textContent = data.user.email;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }

  // Login handler
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        chrome.storage.local.set({ token: data.token }, () => {
          window.location.reload();
        });
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['token'], () => {
      window.location.reload();
    });
  });

  // Edit profile handler
  editProfileBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${backendUrl}/profile` });
  });

  // Forgot password handler
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${backendUrl}/forgot-password` });
  });

  // Register handler
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${backendUrl}/register` });
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
        url: `${backendUrl}/generate-resume`,
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