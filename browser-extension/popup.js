// Popup script for Recall Notebook extension

const API_URL = 'http://localhost:3000'; // Change to your production URL when deployed

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Populate form fields
  document.getElementById('title').value = tab.title || '';
  document.getElementById('url').value = tab.url || '';

  // Get selected text from content script
  chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, (response) => {
    if (response && response.text) {
      document.getElementById('content').value = response.text;
    }
  });

  // Load saved API token
  const { apiToken } = await chrome.storage.sync.get('apiToken');

  if (!apiToken) {
    showStatus('Please configure your API token in settings', 'error');
    document.getElementById('saveBtn').disabled = true;
  }

  // Save button handler
  document.getElementById('saveBtn').addEventListener('click', async () => {
    await saveToNotebook();
  });

  // Settings link handler
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

/**
 * Save current page to Recall Notebook
 */
async function saveToNotebook() {
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  const content = document.getElementById('content').value;

  if (!title) {
    showStatus('Please enter a title', 'error');
    return;
  }

  // Show loading
  document.getElementById('saveBtn').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  try {
    // Get API token from storage
    const { apiToken } = await chrome.storage.sync.get('apiToken');

    if (!apiToken) {
      throw new Error('API token not configured');
    }

    // Fetch URL content
    const response = await fetch(`${API_URL}/api/fetch-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }

    const { content: fetchedContent } = await response.json();

    // Use fetched content or user-provided content
    const finalContent = content || fetchedContent || 'No content available';

    // Summarize content
    const summarizeResponse = await fetch(`${API_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        content: finalContent,
        contentType: 'url',
        title,
        url,
      }),
    });

    if (!summarizeResponse.ok) {
      throw new Error('Failed to summarize content');
    }

    const summary = await summarizeResponse.json();

    // Create source
    const createResponse = await fetch(`${API_URL}/api/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        title,
        content_type: 'url',
        original_content: finalContent,
        url,
        summary_text: summary.summary,
        key_actions: summary.actions,
        key_topics: summary.topics,
        word_count: finalContent.split(/\s+/).length,
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to save source');
    }

    showStatus('✓ Saved to Recall Notebook!', 'success');

    // Close popup after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);

  } catch (error) {
    console.error('Error saving to notebook:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    document.getElementById('saveBtn').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}
