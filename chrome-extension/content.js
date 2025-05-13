// Create and inject the generate button
let currentResumeData = null; // Global variable to store resume data

// Add undo/redo history
let editHistory = [];
let currentHistoryIndex = -1;

function addToHistory(resumeData) {
  // Remove any future history if we're not at the end
  editHistory = editHistory.slice(0, currentHistoryIndex + 1);
  editHistory.push(JSON.parse(JSON.stringify(resumeData))); // Deep copy
  currentHistoryIndex = editHistory.length - 1;
}

function createGenerateButton() {
  const button = document.createElement('button');
  button.id = 'resume-generator-button';
  button.textContent = 'Generate Resume';
  button.className = 'resume-generator-button';
  return button;
}

// Create and inject modal
function createModal(selectedText = '') {
  const modal = document.createElement('div');
  modal.className = 'resume-modal-overlay';
  modal.innerHTML = `
    <div class="resume-modal">
      <div class="resume-modal-header">
        <h2 class="resume-modal-title">Resume Generator</h2>
        <button class="resume-modal-close">&times;</button>
      </div>
      <div class="resume-modal-content">
        <div class="resume-modal-job-description" contenteditable="true" placeholder="Enter job description here..."></div>
        <div class="resume-modal-docx-preview">
          <div class="docx-wrapper"></div>
        </div>
      </div>
      <div class="resume-modal-download">
        <button class="generate">Generate Resume</button>
        <button class="save">Save Changes</button>
        <button class="undo" disabled>Undo</button>
        <button class="redo" disabled>Redo</button>
        <button class="download-pdf">Download PDF</button>
        <button class="download-docx">Download DOCX</button>
      </div>
    </div>
  `;

  // Add event listeners
  const closeBtn = modal.querySelector('.resume-modal-close');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  // Set the formatted content after the modal is created
  const jobDescriptionDiv = modal.querySelector('.resume-modal-job-description');
  if (selectedText) {
    jobDescriptionDiv.innerHTML = selectedText;
  }

  const generateBtn = modal.querySelector('.generate');
  generateBtn.addEventListener('click', async () => {
    const jobDescription = modal.querySelector('.resume-modal-job-description').textContent;
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    try {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';

      // Get the token from chrome.storage.local
      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });

      if (!token) {
        throw new Error('Please log in to generate a resume');
      }
      
      const response = await fetch('http://localhost:3030/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobDescription })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();
      currentResumeData = data.resume;
      
      // Initialize history with the generated resume
      editHistory = [JSON.parse(JSON.stringify(currentResumeData))];
      currentHistoryIndex = 0;
      
      // Update undo/redo buttons
      const undoBtn = modal.querySelector('.undo');
      const redoBtn = modal.querySelector('.redo');
      undoBtn.disabled = true;
      redoBtn.disabled = true;

      // Display the resume
      const docxWrapper = modal.querySelector('.docx-wrapper');
      docxWrapper.innerHTML = formatResumeContent(currentResumeData);
    } catch (error) {
      console.error('Error generating resume:', error);
      alert(error.message || 'Failed to generate resume. Please try again.');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Resume';
    }
  });

  // Save Changes button
  const saveBtn = modal.querySelector('.save');
  saveBtn.addEventListener('click', async () => {
    try {
      const resumeContent = modal.querySelector('.resume-content');
      if (!resumeContent) {
        throw new Error('Resume content not found');
      }

      // Update the currentResumeData with edited content
      const updatedResume = {
        ...currentResumeData,
        name: resumeContent.querySelector('.resume-header h1')?.textContent?.trim() || currentResumeData.name,
        contact: {
          ...currentResumeData.contact,
          email: resumeContent.querySelector('.resume-contact')?.textContent?.split('|')[0]?.trim() || currentResumeData.contact.email,
          phonenumber: resumeContent.querySelector('.resume-contact')?.textContent?.split('|')[1]?.trim() || currentResumeData.contact.phonenumber,
          linkedinURL: resumeContent.querySelector('.resume-contact')?.textContent?.split('|')[2]?.trim() || currentResumeData.contact.linkedinURL,
          github: resumeContent.querySelector('.resume-contact')?.textContent?.split('|')[3]?.trim() || currentResumeData.contact.github
        },
        summary: resumeContent.querySelector('.resume-section p')?.textContent?.trim() || currentResumeData.summary,
        experience: Array.from(resumeContent.querySelectorAll('.resume-experience')).map(exp => ({
          company: exp.querySelector('h3')?.textContent?.split(',')[0]?.trim() || '',
          location: exp.querySelector('h3')?.textContent?.split(',')[1]?.trim() || '',
          position: exp.querySelector('.resume-position')?.textContent?.split('(')[0]?.trim() || '',
          dates: exp.querySelector('.resume-position')?.textContent?.match(/\((.*?)\)/)?.[1]?.trim() || '',
          bullets: Array.from(exp.querySelectorAll('li')).map(li => li.textContent.trim())
        })),
        skills: Array.from(resumeContent.querySelectorAll('.resume-skills')).map(skill => ({
          section: skill.querySelector('h3')?.textContent?.trim() || '',
          list: skill.querySelector('p')?.textContent?.split(',').map(s => s.trim()) || []
        })),
        education: Array.from(resumeContent.querySelectorAll('.resume-education')).map(edu => ({
          school: edu.querySelector('h3')?.textContent?.split(',')[0]?.trim() || '',
          location: edu.querySelector('h3')?.textContent?.split(',')[1]?.trim() || '',
          program: edu.querySelector('.resume-program')?.textContent?.split('(')[0]?.trim() || '',
          dates: edu.querySelector('.resume-program')?.textContent?.match(/\((.*?)\)/)?.[1]?.trim() || ''
        })),
        certifications: Array.from(resumeContent.querySelectorAll('.resume-certification')).map(cert => ({
          name: cert.querySelector('h3')?.textContent?.trim() || '',
          issued: cert.querySelector('.resume-issued')?.textContent?.replace('Issued ', '')?.trim() || ''
        }))
      };

      // Add to history
      addToHistory(updatedResume);
      currentResumeData = updatedResume;

      // Update undo/redo buttons
      const undoBtn = modal.querySelector('.undo');
      const redoBtn = modal.querySelector('.redo');
      undoBtn.disabled = currentHistoryIndex <= 0;
      redoBtn.disabled = currentHistoryIndex >= editHistory.length - 1;

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'save-success';
      successMessage.textContent = 'Changes saved successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes: ' + error.message);
    }
  });

  // Undo button
  const undoBtn = modal.querySelector('.undo');
  undoBtn.addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
      currentHistoryIndex--;
      const previousState = editHistory[currentHistoryIndex];
      currentResumeData = previousState;
      const docxWrapper = modal.querySelector('.docx-wrapper');
      docxWrapper.innerHTML = formatResumeContent(previousState);
      
      // Update button states
      undoBtn.disabled = currentHistoryIndex <= 0;
      redoBtn.disabled = currentHistoryIndex >= editHistory.length - 1;
    }
  });

  // Redo button
  const redoBtn = modal.querySelector('.redo');
  redoBtn.addEventListener('click', () => {
    if (currentHistoryIndex < editHistory.length - 1) {
      currentHistoryIndex++;
      const nextState = editHistory[currentHistoryIndex];
      currentResumeData = nextState;
      const docxWrapper = modal.querySelector('.docx-wrapper');
      docxWrapper.innerHTML = formatResumeContent(nextState);
      
      // Update button states
      undoBtn.disabled = currentHistoryIndex <= 0;
      redoBtn.disabled = currentHistoryIndex >= editHistory.length - 1;
    }
  });

  // Download PDF button
  const downloadPdfBtn = modal.querySelector('.download-pdf');
  downloadPdfBtn.addEventListener('click', async () => {
    try {
      if (!currentResumeData) {
        throw new Error('No resume data available');
      }

      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });

      if (!token) {
        throw new Error('Please log in to download the resume');
      }

      // Show loading state
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.textContent = 'Generating PDF...';

      // First, generate the DOCX file using the template
      const docxResponse = await fetch('http://localhost:3030/api/download/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resume: currentResumeData })
      });

      if (!docxResponse.ok) {
        throw new Error('Failed to generate DOCX file');
      }

      const docxBlob = await docxResponse.blob();

      // Create form data to send the DOCX file for PDF conversion
      const formData = new FormData();
      formData.append('docx', docxBlob, 'resume.docx');

      // Convert DOCX to PDF
      const pdfResponse = await fetch('http://localhost:3030/api/convert-to-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to convert to PDF');
      }

      const pdfBlob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'download-success';
      successMessage.textContent = 'PDF downloaded successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF: ' + error.message);
    } finally {
      // Reset button state
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.textContent = 'Download PDF';
    }
  });

  // Download DOCX button
  const downloadDocxBtn = modal.querySelector('.download-docx');
  downloadDocxBtn.addEventListener('click', async () => {
    try {
      if (!currentResumeData) {
        throw new Error('No resume data available');
      }

      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });

      if (!token) {
        throw new Error('Please log in to download the resume');
      }

      const response = await fetch('http://localhost:3030/api/download/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resume: currentResumeData })
      });

      if (!response.ok) {
        throw new Error('Failed to download DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Failed to download DOCX: ' + error.message);
    }
  });

  // Handle text selection
  function handleTextSelection() {
    const selection = window.getSelection();
    
    // Get the selected HTML content
    let selectedHTML = '';
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);
      selectedHTML = tempDiv.innerHTML;
    }
    
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
        createModal(selectedHTML || selectedText);
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
      createModal(request.jobDescription || '');
      sendResponse({ success: true });
    }
  });

  // Helper function to format resume content
  function formatResumeContent(resume) {
    let html = `
      <div class="resume-content" contenteditable="true">
        <div class="resume-header">
          <h1 contenteditable="true">${resume.name}</h1>
          <div class="resume-contact" contenteditable="true">
            ${resume.contact.email} | ${resume.contact.phonenumber} | ${resume.contact.linkedinURL} | ${resume.contact.github}
          </div>
        </div>

        <div class="resume-section">
          <h2>Professional Summary</h2>
          <p contenteditable="true">${resume.summary}</p>
        </div>

        <div class="resume-section">
          <h2>Professional Experience</h2>
          ${resume.experience.map(exp => `
            <div class="resume-experience">
              <h3 contenteditable="true">${exp.company}, ${exp.location}</h3>
              <div class="resume-position" contenteditable="true">${exp.position} (${exp.dates})</div>
                ${exp.bullets.map(bullet => `<li contenteditable="true">${bullet}</li>`).join('')}
            </div>
          `).join('')}
        </div>

        <div class="resume-section">
          <h2>Skills & Other</h2>
          ${resume.skills.map(skillSection => `
            <div class="resume-skills">
              <h3 contenteditable="true">${skillSection.section}</h3>
              <p contenteditable="true">${skillSection.list.join(', ')}</p>
            </div>
          `).join('')}
        </div>

        <div class="resume-section">
          <h2>Education</h2>
          ${resume.education.map(edu => `
            <div class="resume-education">
              <h3 contenteditable="true">${edu.school}, ${edu.location}</h3>
              <div class="resume-program" contenteditable="true">${edu.program} (${edu.dates})</div>
            </div>
          `).join('')}
        </div>

        ${resume.certifications && resume.certifications.length > 0 ? `
          <div class="resume-section">
            <h2>Certifications</h2>
            ${resume.certifications.map(cert => `
              <div class="resume-certification">
                <h3 contenteditable="true">${cert.name}</h3>
                <div class="resume-issued" contenteditable="true">Issued ${cert.issued}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    return html;
  }

  document.body.appendChild(modal);
}

// Handle text selection
function handleTextSelection() {
  const selection = window.getSelection();
  
  // Get the selected HTML content
  let selectedHTML = '';
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    selectedHTML = tempDiv.innerHTML;
  }
  
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
      createModal(selectedHTML || selectedText);
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
    createModal(request.jobDescription || '');
    sendResponse({ success: true });
  }
});

// Helper function to format resume content
function formatResumeContent(resume) {
  let html = `
    <div class="resume-content" contenteditable="true">
      <div class="resume-header">
        <h1 contenteditable="true">${resume.name}</h1>
        <div class="resume-contact" contenteditable="true">
          ${resume.contact.email} | ${resume.contact.phonenumber} | ${resume.contact.linkedinURL} | ${resume.contact.github}
        </div>
      </div>

      <div class="resume-section">
        <h2>Professional Summary</h2>
        <p contenteditable="true">${resume.summary}</p>
      </div>

      <div class="resume-section">
        <h2>Professional Experience</h2>
        ${resume.experience.map(exp => `
          <div class="resume-experience">
            <h3 contenteditable="true">${exp.company}, ${exp.location}</h3>
            <div class="resume-position" contenteditable="true">${exp.position} (${exp.dates})</div>
            <ul>
              ${exp.bullets.map(bullet => `<li contenteditable="true">${bullet}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div class="resume-section">
        <h2>Skills & Other</h2>
        ${resume.skills.map(skillSection => `
          <div class="resume-skills">
            <h3 contenteditable="true">${skillSection.section}</h3>
            <p contenteditable="true">${skillSection.list.join(', ')}</p>
          </div>
        `).join('')}
      </div>

      <div class="resume-section">
        <h2>Education</h2>
        ${resume.education.map(edu => `
          <div class="resume-education">
            <h3 contenteditable="true">${edu.school}, ${edu.location}</h3>
            <div class="resume-program" contenteditable="true">${edu.program} (${edu.dates})</div>
          </div>
        `).join('')}
      </div>

      ${resume.certifications && resume.certifications.length > 0 ? `
        <div class="resume-section">
          <h2>Certifications</h2>
          ${resume.certifications.map(cert => `
            <div class="resume-certification">
              <h3 contenteditable="true">${cert.name}</h3>
              <div class="resume-issued" contenteditable="true">Issued ${cert.issued}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  return html;
}