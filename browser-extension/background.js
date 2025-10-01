// Background script for Recall Notebook extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Recall Notebook extension installed');
});

// Context menu for saving selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToRecall',
    title: 'Save to Recall Notebook',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveToRecall') {
    // Open popup with selected text
    chrome.action.openPopup();
  }
});
