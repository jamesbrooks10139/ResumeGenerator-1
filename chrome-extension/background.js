const backendUrl = 'http://162.218.114.85:3030/api';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Initialize storage with default values
  chrome.storage.local.get(['token', 'user'], (result) => {
    if (!result.token) {
      chrome.storage.local.set({
        token: null,
        user: null,
        lastAuthCheck: null
      });
    }
  });
});

// Handle authentication state
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_AUTH') {
    chrome.storage.local.get(['token', 'lastAuthCheck'], async (result) => {
      if (result.token) {
        // Check if token is still valid
        try {
          const response = await fetch(`${backendUrl}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${result.token}`
            }
          });

          if (response.ok) {
            // Update last auth check time
            chrome.storage.local.set({ lastAuthCheck: Date.now() });
            sendResponse({ isAuthenticated: true });
          } else {
            // Token is invalid, clear storage
            chrome.storage.local.remove(['token', 'user', 'lastAuthCheck']);
            chrome.action.setPopup({ popup: 'popup/login.html' });
            sendResponse({ isAuthenticated: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          sendResponse({ isAuthenticated: false });
        }
      } else {
        sendResponse({ isAuthenticated: false });
      }
    });
    return true; // Required for async sendResponse
  }

  if (request.type === 'LOGOUT') {
    chrome.storage.local.remove(['token', 'user', 'lastAuthCheck'], () => {
      // Update popup to login page
      chrome.action.setPopup({ popup: 'popup/login.html' });
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'API_REQUEST') {
    const { url, method = 'GET', body, responseType = 'json' } = request;

    chrome.storage.local.get(['token'], async (result) => {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.token}`
          },
          body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
          // If token is invalid, clear storage and redirect to login
          if (response.status === 401) {
            chrome.storage.local.remove(['token', 'user', 'lastAuthCheck']);
            chrome.action.setPopup({ popup: 'popup/login.html' });
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (responseType === 'blob') {
          const blob = await response.blob();
          // Convert blob to base64 for transfer
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result;
            sendResponse({ 
              success: true, 
              data: base64data,
              type: blob.type
            });
          };
        } else {
          const data = await response.json();
          sendResponse({ success: true, data });
        }

        // Update last auth check time on successful request
        chrome.storage.local.set({ lastAuthCheck: Date.now() });
      } catch (error) {
        console.error('API request error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });

    return true; // Keep the message channel open for async response
  }
});

// Handle token expiration and storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.token) {
      const newToken = changes.token.newValue;
      if (!newToken) {
        // Token was removed, redirect to login
        chrome.action.setPopup({ popup: 'popup/login.html' });
      }
    }
  }
});

// Periodically check token validity (every 5 minutes)
setInterval(async () => {
  chrome.storage.local.get(['token', 'lastAuthCheck'], async (result) => {
    if (result.token) {
      try {
        const response = await fetch(`${backendUrl}/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        });

        if (!response.ok) {
          // Token is invalid, clear storage
          chrome.storage.local.remove(['token', 'user', 'lastAuthCheck']);
          chrome.action.setPopup({ popup: 'popup/login.html' });
        } else {
          // Update last auth check time
          chrome.storage.local.set({ lastAuthCheck: Date.now() });
        }
      } catch (error) {
        console.error('Token validation failed:', error);
      }
    }
  });
}, 5 * 60 * 1000); // Check every 5 minutes 