# CareerTracker Clipper — Browser Extension

A Chrome/Edge extension that clips job postings from **LinkedIn, Indeed, Glassdoor, and Naukri** directly into your CareerTracker app.

---

## Features

- **Auto-scrapes** job title, company, location, and description from job postings
- **OTP login** — same auth flow as the main app (no separate credentials)
- **One-click save** — fills the form, you click "Save to CareerTracker"
- **Configurable backend URL** — works with localhost and deployed backends (Railway, Render, etc.)
- Detects supported sites automatically; manual entry works on any other page

---

## Setup

### 1. Generate Icons

Run the icon generator (requires Pillow):

```bash
cd browser-extension
pip install pillow
python create_icons.py
```

This creates `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png`.

### 2. Load in Chrome / Edge

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the `browser-extension/` folder
5. The extension icon appears in your toolbar

### 2b. Load in Firefox

1. Open Firefox → go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Navigate to the `browser-extension/` folder and select **manifest.json**
4. The extension icon appears in your toolbar

> **Note:** Temporary add-ons in Firefox are removed when the browser closes. For a permanent install, the extension needs to be signed by Mozilla — which is free via [addons.mozilla.org](https://addons.mozilla.org/developers/) (submit as unlisted for personal use).

### 3. First Use

1. Click the extension icon
2. Enter your CareerTracker email → receive OTP → verify
3. Navigate to any job posting on LinkedIn, Indeed, Glassdoor, or Naukri
4. Click the extension icon → job details are auto-filled
5. Adjust status/confidence → click **Save to CareerTracker**

---

## Supported Job Boards

| Site       | Auto-fills |
|------------|------------|
| LinkedIn   | Title, Company, Location, Description |
| Indeed     | Title, Company, Location, Description |
| Glassdoor  | Title, Company, Location, Description |
| Naukri     | Title, Company, Location, Description |
| Other      | URL only (manual entry) |

---

## Settings

Click the ⚙️ tab in the popup to:
- Change the **Backend URL** (default: `http://localhost:8000/api/`) — update this when you deploy
- **Sign out**

---

## Backend Requirements

The extension uses these CareerTracker API endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/users/auth/request-otp/` | Send OTP email |
| `POST` | `/users/auth/verify-otp/` | Verify OTP, get JWT tokens |
| `POST` | `/users/auth/token/refresh/` | Refresh access token |
| `POST` | `/jobs/` | Create a new job application |

No backend changes required — it uses the existing API.

---

## Files

```
browser-extension/
├── manifest.json       # Extension manifest (MV3)
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── content.js          # Job page scraper (runs on job sites)
├── background.js       # Service worker (API calls, auth)
├── create_icons.py     # Script to generate placeholder icons
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
