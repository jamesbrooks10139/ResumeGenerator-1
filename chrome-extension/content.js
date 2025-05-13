// Create and inject the generate button
let currentResumeData = null; // Global variable to store resume data

function createGenerateButton() {
  const button = document.createElement('button');
  button.id = 'resume-generator-button';
  button.textContent = 'Generate Resume';
  button.className = 'resume-generator-button';
  return button;
}

// Create and inject modal
function createModal(jobDescription) {
  // Remove existing modal if any
  const existingModal = document.querySelector('.resume-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = `
    <div class="resume-modal-overlay">
      <div class="resume-modal">
        <div class="resume-modal-header">
          <h2 class="resume-modal-title">Resume Generator</h2>
          <button class="resume-modal-close">&times;</button>
        </div>
        <div class="resume-modal-content">
          <div class="resume-modal-job-description">${jobDescription}</div>
          <div class="resume-modal-actions">
            <button class="resume-modal-button secondary" id="cancelBtn">Cancel</button>
            <button class="resume-modal-button primary" id="generateBtn">Generate Resume</button>
          </div>
        </div>
        <div id="loading" class="resume-modal-loading hidden">
          <div class="resume-modal-spinner"></div>
          <p>Generating your resume...</p>
        </div>
        <div id="result" class="resume-modal-result hidden"></div>
        <div id="download" class="resume-modal-download hidden">
          <button id="downloadPdf">Download PDF</button>
          <button id="downloadDocx">Download DOCX</button>
        </div>
      </div>
    </div>
  `;

  // Create and inject modal
  const modalElement = document.createElement('div');
  modalElement.innerHTML = modalHTML;
  document.body.appendChild(modalElement.firstElementChild);
  
  // Get modal elements
  const modal = document.querySelector('.resume-modal-overlay');
  const closeBtn = modal.querySelector('.resume-modal-close');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const generateBtn = modal.querySelector('#generateBtn');
  const loadingDiv = modal.querySelector('#loading');
  const resultDiv = modal.querySelector('#result');
  const downloadDiv = modal.querySelector('#download');
  const downloadPdfBtn = modal.querySelector('#downloadPdf');
  const downloadDocxBtn = modal.querySelector('#downloadDocx');

  // Handle modal close
  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = '';
  };

  // Event listeners
  closeBtn.addEventListener('mousedown', closeModal);
  cancelBtn.addEventListener('mousedown', closeModal);
  modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) closeModal();
  });

  // Prevent modal from closing when clicking inside
  modal.querySelector('.resume-modal').addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Handle generate button
  generateBtn.addEventListener('mousedown', async () => {
    loadingDiv.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
      const authResponse = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      if (!authResponse.isAuthenticated) {
        alert('Please log in to generate a resume');
        closeModal();
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: 'http://localhost:3030/api/generate-resume',
        method: 'POST',
        body: { jobDescription }
      });

      if (response.success) {
        currentResumeData = response.data.resume; // Store the resume data globally
        
        // Format the resume data into a readable string for display
        let formattedResume = `${currentResumeData.name}\n`;
        
        // Format contact information
        const contact = currentResumeData.contact;
        formattedResume += `${contact.email} | ${contact.phonenumber} | ${contact.linkedinURL} | ${contact.github}\n\n`;

        // Add summary
        if (currentResumeData.summary) {
          formattedResume += `PROFESSIONAL SUMMARY\n${currentResumeData.summary}\n\n`;
        }

        // Add experience
        formattedResume += 'PROFESSIONAL EXPERIENCE\n';
        currentResumeData.experience.forEach(exp => {
          formattedResume += `${exp.company}, ${exp.location}\n`;
          formattedResume += `${exp.position} (${exp.dates})\n`;
          exp.bullets.forEach(bullet => {
            formattedResume += `● ${bullet}\n`;
          });
          formattedResume += '\n';
        });

        // Add skills
        formattedResume += 'SKILLS & OTHER\n';
        currentResumeData.skills.forEach(skillSection => {
          formattedResume += `${skillSection.section}:\n`;
          formattedResume += `${skillSection.list.join(', ')}\n\n`;
        });

        // Add education
        formattedResume += 'EDUCATION\n';
        currentResumeData.education.forEach(edu => {
          formattedResume += `${edu.school}, ${edu.location}\n`;
          formattedResume += `${edu.program} (${edu.dates})\n\n`;
        });

        // Add certifications
        if (currentResumeData.certifications && currentResumeData.certifications.length > 0) {
          formattedResume += 'CERTIFICATIONS\n';
          currentResumeData.certifications.forEach(cert => {
            formattedResume += `${cert.name}    Issued ${cert.issued}\n`;
          });
        }

        resultDiv.textContent = formattedResume;
        resultDiv.classList.remove('hidden');
        downloadDiv.classList.remove('hidden');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      alert(error.message || 'Failed to generate resume');
    } finally {
      loadingDiv.classList.add('hidden');
      generateBtn.disabled = false;
    }
  });

  // Handle download buttons
  downloadPdfBtn.addEventListener('mousedown', async () => {
    try {
      if (!currentResumeData) {
        throw new Error('No resume data available');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: 'http://localhost:3030/api/download/pdf',
        method: 'POST',
        body: { resume: currentResumeData },
        responseType: 'blob'
      });

      if (response.success) {
        // Convert base64 to blob
        const byteString = atob(response.data.split(',')[1]);
        const mimeString = response.type;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      alert('Failed to download PDF: ' + error.message);
    }
  });

  downloadDocxBtn.addEventListener('mousedown', async () => {
    try {
      if (!currentResumeData) {
        throw new Error('No resume data available');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: 'http://localhost:3030/api/download/docx',
        method: 'POST',
        body: { resume: currentResumeData },
        responseType: 'blob'
      });

      if (response.success) {
        // Convert base64 to blob
        const byteString = atob(response.data.split(',')[1]);
        const mimeString = response.type;
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
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      alert('Failed to download DOCX: ' + error.message);
    }
  });

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}

// Handle text selection
function handleTextSelection() {
  console.log('handleTextSelection');
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Remove existing button if any
  const existingButton = document.getElementById('resume-generator-button');
  if (existingButton) {
    existingButton.remove();
  }

  if (selectedText) {
    const button = createGenerateButton();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position the button near the selection
    button.style.left = `${rect.left + window.scrollX}px`;
    button.style.top = `${rect.bottom + 10}px`;

    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      createModal(selectedText);
    });

    document.body.appendChild(button);
  }
}

// Add event listeners
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    const button = document.getElementById('resume-generator-button');
    if (button) button.remove();
    const modal = document.querySelector('.resume-modal-overlay');
    if (modal) modal.remove();
  }
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SHOW_MODAL') {
    createModal(request.jobDescription);
    sendResponse({ success: true });
  }
}); 