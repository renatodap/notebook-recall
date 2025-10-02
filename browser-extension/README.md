# Recall Notebook Browser Extension

Save web pages to your Recall Notebook with one click!

## Features

- 📌 One-click save from any webpage
- 📝 Automatically summarizes content using AI
- 🔖 Save selected text or entire page
- 🏷️ Auto-generates topics and action items
- ⚡ Fast and lightweight

## Installation

### Chrome / Edge

1. **Generate Icons** (if not already done):
   - Open `generate-icons.html` in your browser (from project root)
   - Download all 3 extension icons (16px, 48px, 128px)
   - Save them to `browser-extension/icons/` folder

2. **Install Extension**:
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - Extension is now ready!

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the `browser-extension` folder

## Configuration

**Already configured for localhost!**

The extension is pre-configured to work with `http://localhost:3000`.

If you deploy to production, update `API_URL` in `popup.js`:
```javascript
const API_URL = 'https://your-production-url.com';
```

**Note:** The extension uses Supabase authentication from your browser session, so you must be logged into the app in the same browser.

## Usage

### Method 1: Extension Popup

1. Navigate to any webpage
2. Click the Recall Notebook extension icon
3. Review/edit the title and content
4. Click "Save to Notebook"

### Method 2: Context Menu

1. Select text on any webpage
2. Right-click and select "Save to Recall Notebook"
3. The extension will save the selected text

## Development

### Build Icons

Place icon files in `browser-extension/icons/`:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

### Update API URL

Edit `popup.js` and change `API_URL` to your production URL:

```javascript
const API_URL = 'https://notebook-recall.vercel.app';
```

## Permissions

- `activeTab`: Access current tab's URL and title
- `storage`: Store API token securely
- `host_permissions`: Communicate with Recall Notebook API

## Privacy

- Your API token is stored locally in your browser
- Extension only accesses the current tab when you click the icon
- No data is sent to third parties
- All communication is with your Recall Notebook instance

## Support

For issues or feature requests, visit:
https://github.com/yourusername/recall-notebook/issues
