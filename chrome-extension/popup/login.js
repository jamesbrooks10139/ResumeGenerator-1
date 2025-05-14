const backendUrl = 'https://162.218.114.85:3030/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  // Check if user is already logged in
  chrome.storage.local.get(['token', 'user'], (result) => {
    if (result.token) {
      window.location.href = 'popup.html';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
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