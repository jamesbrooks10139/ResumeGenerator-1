const backendUrl = 'http://localhost:3030/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      full_name: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      phone: document.getElementById('phone').value,
      personal_email: document.getElementById('personalEmail').value,
      linkedin_url: document.getElementById('linkedinUrl').value,
      github_url: document.getElementById('githubUrl').value
    };

    const confirmPassword = document.getElementById('confirmPassword').value;

    if (formData.password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and user data
      chrome.storage.local.set({
        token: data.token,
        user: data.user,
      }, () => {
        // Redirect to main popup
        window.location.href = 'popup.html';
      });
    } catch (error) {
      alert(error.message);
    }
  });
}); 