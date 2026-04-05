# CareerTracker — Full Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository Structure](#4-repository-structure)
5. [Backend — Django REST API](#5-backend--django-rest-api)
   - [Settings & Configuration](#51-settings--configuration)
   - [Data Models](#52-data-models)
   - [API Endpoints](#53-api-endpoints)
   - [Authentication Flow](#54-authentication-flow)
   - [File Uploads](#55-file-uploads)
   - [Email & Reminders](#56-email--reminders)
6. [Frontend — React App](#6-frontend--react-app)
   - [Routing](#61-routing)
   - [API Layer](#62-api-layer)
   - [Pages & Components](#63-pages--components)
7. [Browser Extension](#7-browser-extension)
8. [Deployment](#8-deployment)
9. [Local Development Setup](#9-local-development-setup)
10. [Environment Variables](#10-environment-variables)

---

## 1. Project Overview

**CareerTracker** is a full-stack web application that helps job seekers track and manage their job applications end-to-end. Users can log applications, monitor statuses, attach documents (resume, cover letter, cold email), schedule interviews, and view analytics on their job search. A companion browser extension lets users clip job postings from LinkedIn, Indeed, Glassdoor, and Naukri directly into the app.

**Core capabilities:**
- Track job applications with statuses: Applied, Ghosted, Interview, Replied, Offer, Rejected
- Attach documents (Resume, Cover Letter, Cold Email, Others) per application
- Schedule and track interviews with feedback and ratings
- Automatic email reminders 24 hours before an interview
- Analytics dashboard (offer rate, rejection rate, interview rate, status breakdown)
- User profile with skills, experience, social links
- OTP-based passwordless login (no passwords stored)
- Browser extension for one-click job clipping from major job boards

---

## 2. Architecture

```
┌──────────────────────────┐      HTTP/JSON        ┌──────────────────────────┐
│   React Frontend         │ ◄──────────────────►  │   Django REST API        │
│   (Vercel, port 5173)    │                       │   (Render, port 8000)    │
└──────────────────────────┘                       └────────────┬─────────────┘
                                                                │
┌──────────────────────────┐      HTTP/JSON                     │ ORM
│   Browser Extension      │ ◄────────────────────────────────  │
│   (Chrome / Edge / FF)   │                       ┌────────────▼─────────────┐
└──────────────────────────┘                       │   Database               │
                                                   │   SQLite (local)         │
                                                   │   PostgreSQL (production)│
                                                   └──────────────────────────┘
```

Django and React are completely decoupled. Django serves **only JSON** via a REST API; React renders the UI and communicates exclusively via HTTP requests using Axios. CORS is configured to allow all origins.

---

## 3. Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Django | 6.0.2 | Web framework |
| Django REST Framework | 3.16.1 | REST API toolkit |
| djangorestframework-simplejwt | 5.5.1 | JWT access/refresh tokens |
| dj-rest-auth | 7.1.1 | Auth endpoints (login, logout, registration) |
| django-allauth | 65.14.3 | Social auth (Google OAuth2) |
| django-cors-headers | 4.9.0 | Cross-origin request handling |
| django-filter | 25.2 | Query parameter filtering |
| drf-spectacular | 0.29.0 | Auto-generated OpenAPI / Swagger docs |
| dj-database-url | 3.1.2 | Parse `DATABASE_URL` env var |
| python-decouple | 3.8 | `.env` file / env var management |
| gunicorn | 25.1.0 | WSGI production server |
| whitenoise | 6.12.0 | Serve static files in production |
| psycopg2-binary | 2.9.11 | PostgreSQL driver |
| Pillow | 12.1.1 | Image processing (extension icon gen) |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library |
| Vite | 7.3.1 | Build tool and dev server |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| React Router DOM | 7.13.1 | Client-side routing |
| Axios | 1.13.5 | HTTP client with interceptors |
| @mantine/core | 8.3.15 | UI component library |
| @mantine/form | 8.3.15 | Form state management |
| @mantine/notifications | 8.3.15 | Toast notifications |
| @mantine/dates | 8.3.15 | Date/time picker components |
| @tabler/icons-react | 3.37.1 | Icon set |

### Browser Extension
- Manifest V3 (Chrome, Edge, Firefox-compatible)
- Vanilla JavaScript (no framework)

---

## 4. Repository Structure

```
careerTracker/
├── GUIDE.md                        ← Comprehensive learning guide (how/why each feature works)
├── DOCUMENTATION.md                ← This file
├── railpack.toml                   ← Root-level Railpack config
│
├── careertracker/                  ← Django project root
│   ├── manage.py                   ← Django management CLI
│   ├── requirements.txt            ← Python dependencies
│   ├── db.sqlite3                  ← Local SQLite database
│   ├── render.yaml                 ← Render blueprint for backend deployment
│   ├── frontend/vercel.json        ← Vercel routing config for the frontend
│   │
│   ├── careertracker/              ← Django project config package
│   │   ├── settings.py             ← All configuration (DB, email, JWT, CORS, installed apps)
│   │   ├── urls.py                 ← Root URL dispatcher
│   │   ├── wsgi.py / asgi.py       ← Server entry points
│   │
│   ├── jobs/                       ← Django app: job tracking
│   │   ├── models.py               ← JobApplication, Interview, JobDocument
│   │   ├── serializers.py          ← Model ↔ JSON conversion
│   │   ├── views.py                ← API request handlers
│   │   ├── urls.py                 ← URL patterns
│   │   ├── admin.py                ← Django admin registration
│   │   ├── migrations/             ← Database schema history (10 migrations)
│   │   └── management/commands/
│   │       └── send_reminders.py   ← Management command: email interview reminders
│   │
│   ├── users/                      ← Django app: auth & profiles
│   │   ├── models.py               ← EmailOTP, Profile
│   │   ├── serializers.py          ← Profile serializer
│   │   ├── views.py                ← send_otp, verify_otp, UserProfileView
│   │   ├── urls.py                 ← URL patterns
│   │   ├── signals.py              ← Auto-create Profile on User creation
│   │   └── migrations/             ← 4 migrations
│   │
│   └── media/
│       └── job_documents/          ← Uploaded files stored here
│
├── frontend/                       ← React + Vite app
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   ├── vercel.json                 ← Vercel deployment config
│   ├── index.html                  ← HTML entry point
│   └── src/
│       ├── main.tsx                ← React app mount point
│       ├── App.tsx                 ← Route definitions and PrivateRoute guard
│       ├── api.ts                  ← Axios instance with JWT interceptors
│       ├── components/
│       │   └── Navbar.tsx          ← Navigation bar
│       └── pages/
│           ├── Login.tsx           ← Email entry (step 1 of auth)
│           ├── VerifyOTP.tsx       ← OTP entry (step 2 of auth)
│           ├── Dashboard.tsx       ← Job application list + add/edit/delete
│           ├── JobDetails.tsx      ← Single job view with documents & interviews
│           ├── InterviewSection.tsx← Interview CRUD within JobDetails
│           ├── DocumentSection.tsx ← Document upload/download within JobDetails
│           ├── Analytics.tsx       ← Charts and stats
│           └── Profile.tsx         ← User profile view and edit
│
└── browser-extension/
    ├── manifest.json               ← Extension manifest (MV3)
    ├── popup.html                  ← Extension popup UI
    ├── popup.js                    ← Popup logic (auth, scrape, save)
    ├── content.js                  ← Job page scraper (injected into job sites)
    ├── background.js               ← Service worker
    ├── create_icons.py             ← Python script to generate PNG icons
    └── icons/                      ← Generated 16/48/128px icons
```

---

## 5. Backend — Django REST API

### 5.1 Settings & Configuration

**Key configurations in `careertracker/settings.py`:**

| Setting | Value | Notes |
|---|---|---|
| `DEBUG` | `False` in prod | Read from env via `python-decouple` |
| `ALLOWED_HOSTS` | `['*']` | Required for Render service host and health checks |
| `DATABASES` | SQLite (local) / PostgreSQL (prod) | Switches automatically based on `DATABASE_URL` env var |
| `CORS_ALLOW_ALL_ORIGINS` | `True` | Allows the frontend and extension to make requests |
| `APPEND_SLASH` | `False` | Prevents POST requests being redirected, which would convert them to GET (405) |
| JWT access token lifetime | 60 minutes | Configured via `SIMPLE_JWT` |
| JWT refresh token lifetime | 7 days | Configured via `SIMPLE_JWT` |
| Media files | `/media/` URL, `BASE_DIR/media` root | Uploaded files available under `/media/` |
| Static files | WhiteNoise serves in production | `STATIC_ROOT = BASE_DIR/staticfiles` |
| Email backend | Gmail SMTP (TLS port 587) | Credentials via env vars |

**Authentication classes (DRF default):** `JWTAuthentication` — all endpoints require a valid Bearer token unless explicitly marked `AllowAny`.

**API documentation:** Auto-generated OpenAPI schema at `/api/schema/` and Swagger UI at `/api/schema/swagger-ui/`.

---

### 5.2 Data Models

#### `jobs` app

**`JobApplication`** — the core entity, one row per job a user applied to.

| Field | Type | Notes |
|---|---|---|
| `user` | ForeignKey → User | Owner; cascades on delete |
| `job_title` | CharField(200) | e.g. "Software Engineer" |
| `role_type` | CharField(200) | e.g. "Full-time", "Internship" |
| `company` | CharField(50) | Company name |
| `applied_at` | DateTimeField | Auto-set on create |
| `duration` | CharField(30) | Contract length, e.g. "6 months" |
| `salary_est` | IntegerField | Optional estimated salary |
| `status` | CharField choices | `APPLIED`, `GHOSTED`, `INTERVIEW`, `REPLIED`, `OFFER`, `REJECTED` |
| `location` | CharField(200) | Job location |
| `application_link` | URLField | Link to original job post |
| `confidence` | CharField choices | `HIGH`, `MEDIUM`, `LOW` |
| `contacts` | CharField | Recruiter/referral contacts |
| `notes` | TextField | Free-form notes |
| `source` | CharField choices | `LINKEDIN`, `REFERRAL`, `JOB_PORTAL`, `COMPANY_WEBSITE`, `COLLEGE`, `NETWORKING`, `RECRUITER`, `OTHER` |

**`JobDocument`** — files attached to a job application.

| Field | Type | Notes |
|---|---|---|
| `job` | ForeignKey → JobApplication | Cascades on delete |
| `file` | FileField | Uploaded to `job_documents/` |
| `doc_types` | CharField choices | `RESUME`, `COLD EMAIL`, `COVER LETTER`, `OTHERS` |
| `uploaded_at` | DateTimeField | Auto-set on create |

**`Interview`** — interview rounds scheduled for a job application.

| Field | Type | Notes |
|---|---|---|
| `job` | ForeignKey → JobApplication | Cascades on delete |
| `interview_at` | DateTimeField | Scheduled date/time |
| `interview_with` | CharField(100) | Interviewer name |
| `meeting_link` | URLField | Zoom/Meet/Teams link |
| `type` | CharField choices | `HR`, `BEHAVIOURAL`, `TECHNICAL`, `MANAGERIAL`, `GD`, `OTHERS` |
| `remainder_sent` | BooleanField | Tracks if reminder email was sent |
| `feedback` | TextField | Post-interview notes |
| `rating` | IntegerField (0–5) | Self-assessed performance |

#### `users` app

**`EmailOTP`** — temporary one-time passwords, deleted after successful verification.

| Field | Type | Notes |
|---|---|---|
| `email` | EmailField | Target email |
| `otp` | CharField(6) | 6-digit code |
| `created_at` | DateTimeField | Used to enforce 5-minute expiry |

**`Profile`** — extended user information, one per `User` (auto-created via signal).

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOneField → User | Cascades on delete |
| `first_name` / `last_name` | CharField(50) | Display name |
| `bio` | TextField | Short biography |
| `phone` | CharField(20) | Phone number |
| `location` | CharField(100) | City/region |
| `target_role` | CharField(100) | Desired job role |
| `skills` | TextField | Comma-separated skills list |
| `years_exp` | PositiveIntegerField | Years of experience |
| `linkedin_url` / `portfolio_url` / `github_url` | URLField | Social/portfolio links |
| `created_at` | DateTimeField | Profile creation timestamp |

---

### 5.3 API Endpoints

All endpoints are prefixed with `/api/`. Protected endpoints require `Authorization: Bearer <access_token>`.

#### Authentication (`/api/users/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/users/send-otp/` | Public | Generates a 6-digit OTP and emails it |
| POST | `/api/users/verify-otp/` | Public | Validates OTP; returns JWT access + refresh tokens |
| GET | `/api/users/profile/` | Protected | Retrieve the authenticated user's profile |
| PATCH/PUT | `/api/users/profile/` | Protected | Update the profile |

JWT token management:

| Method | URL | Description |
|---|---|---|
| POST | `/api/login/` | Standard JWT login (username + password) |
| POST | `/api/refresh/` | Exchange refresh token for new access token |
| GET/POST | `/api/auth/...` | dj-rest-auth endpoints (registration, password reset, etc.) |
| POST | `/api/auth/google/` | Google OAuth2 social login |

#### Job Applications (`/api/jobs/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs/` | Protected | List all job applications for current user |
| POST | `/api/jobs/` | Protected | Create a new job application |
| GET | `/api/jobs/<id>/` | Protected | Retrieve a single job application |
| PUT/PATCH | `/api/jobs/<id>/` | Protected | Update a job application |
| DELETE | `/api/jobs/<id>/` | Protected | Delete a job application |
| GET | `/api/jobs/stats/` | Protected | Analytics data (rates, status breakdown) |

**Filtering / searching / ordering** on the list endpoint:
- Filter by: `status`, `source`, `confidence`, `role_type`
- Search (text): `company`, `job_title`, `location`, `contacts`, `notes`
- Order by: `applied_at`, `salary_est`, `confidence`
- Default ordering: `-applied_at` (newest first)

#### Interviews (`/api/jobs/interviews/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs/interviews/` | Protected | List all interviews for current user's jobs |
| POST | `/api/jobs/interviews/` | Protected | Schedule a new interview |
| GET | `/api/jobs/interviews/<id>/` | Protected | Retrieve a single interview |
| PUT/PATCH | `/api/jobs/interviews/<id>/` | Protected | Update interview details or feedback |
| DELETE | `/api/jobs/interviews/<id>/` | Protected | Delete an interview |

#### Documents (`/api/jobs/documents/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs/documents/` | Protected | List all documents for current user's jobs |
| POST | `/api/jobs/documents/` | Protected | Upload a new document (multipart/form-data) |
| GET | `/api/jobs/documents/<id>/` | Protected | Retrieve/download a document |
| PUT/PATCH | `/api/jobs/documents/<id>/` | Protected | Update document metadata |
| DELETE | `/api/jobs/documents/<id>/` | Protected | Delete a document |

#### Utility

| Method | URL | Description |
|---|---|---|
| GET | `/health/` | Health check (returns `{"status": "ok"}`) |
| GET | `/api/schema/` | OpenAPI schema (YAML/JSON) |
| GET | `/api/schema/swagger-ui/` | Interactive Swagger UI |
| Any | `/admin/` | Django admin panel |

---

### 5.4 Authentication Flow

CareerTracker uses **passwordless OTP login**. No passwords are stored.

```
1. User enters email address
        │
        ▼
2. Frontend POST /api/users/send-otp/
        │  Backend generates random 6-digit OTP
        │  Stores EmailOTP(email, otp, created_at) in DB
        │  Sends OTP via Gmail SMTP
        ▼
3. User enters OTP received in email
        │
        ▼
4. Frontend POST /api/users/verify-otp/
        │  Backend looks up EmailOTP record
        │  Validates OTP is not expired (5-minute window)
        │  get_or_create User with email=username=email
        │  Generates JWT access token (60 min) + refresh token (7 days)
        │  Deletes all OTP records for that email
        │  Returns { access, refresh }
        ▼
5. Frontend stores tokens in localStorage
        │  access_token → attached as Bearer header to all API requests
        │  refresh_token → used to silently refresh expired access tokens
```

**Token refresh** is handled automatically by an Axios interceptor:
- On any 401 response, the interceptor calls `/api/refresh/` with the stored refresh token
- If successful, retries the original request with the new access token
- If refresh fails (token expired/invalid), clears storage and redirects to `/login`

---

### 5.5 File Uploads

Documents are uploaded as `multipart/form-data`. Django saves files to `MEDIA_ROOT/job_documents/` (local) or the same relative path in production. Files are served under the `/media/` URL prefix.

Security: `JobDocumentListView.perform_create()` verifies the `job` referenced in the upload belongs to the authenticated user before saving.

---

### 5.6 Email & Reminders

**OTP emails**: Sent via `django.core.mail.send_mail` through Gmail SMTP. Credentials injected via `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` environment variables.

**Interview reminders**: A custom Django management command `send_reminders` queries all `Interview` objects scheduled within the next 24 hours where `remainder_sent=False`, emails the owning user, and sets `remainder_sent=True`.

To run manually:
```bash
python manage.py send_reminders
```

In production this should be scheduled (e.g., Render cron, Celery beat, or an external cron service) to run once daily.

---

## 6. Frontend — React App

### 6.1 Routing

Routes are defined in [frontend/src/App.tsx](frontend/src/App.tsx).

| Path | Component | Protected |
|---|---|---|
| `/login` | `Login` | No |
| `/verify-otp` | `VerifyOTP` | No |
| `/dashboard` | `Dashboard` | Yes |
| `/analytics` | `Analytics` | Yes |
| `/profile` | `Profile` | Yes |
| `/jobs/:id` | `JobDetails` | Yes |
| `*` (any) | Redirect to `/login` | — |

**`PrivateRoute`**: Reads `access_token` from `localStorage`. If absent, redirects to `/login`.

---

### 6.2 API Layer

[frontend/src/api.ts](frontend/src/api.ts) exports a configured Axios instance:

- **Base URL**: `VITE_API_URL` env var, defaults to `http://localhost:8000/api/`
- **Request interceptor**: Reads `access_token` from `localStorage` and adds `Authorization: Bearer <token>` header to every request
- **Response interceptor**: On 401, attempts token refresh via `/refresh/`. On success, retries the original request. On failure, clears tokens and redirects to `/login`

---

### 6.3 Pages & Components

| File | Responsibility |
|---|---|
| `Login.tsx` | Collects email, calls `POST /users/send-otp/`, redirects to `/verify-otp` |
| `VerifyOTP.tsx` | Collects 6-digit OTP, calls `POST /users/verify-otp/`, stores tokens, redirects to `/dashboard` |
| `Dashboard.tsx` | Lists all job applications; supports filtering, searching, sorting; allows add/edit/delete of applications |
| `JobDetails.tsx` | Full detail view for a single application; hosts `InterviewSection` and `DocumentSection` |
| `InterviewSection.tsx` | CRUD for interviews within a job; shows interview date, type, rating, feedback |
| `DocumentSection.tsx` | Upload and list documents for a job (Resume, Cover Letter, Cold Email, Others) |
| `Analytics.tsx` | Calls `GET /jobs/stats/` and renders offer rate, rejection rate, interview rate, status breakdown charts |
| `Profile.tsx` | Calls `GET/PATCH /users/profile/` to display and edit user profile details |
| `Navbar.tsx` | Navigation links: Dashboard, Analytics, Profile; handles logout (clears localStorage) |

All UI is built with **Mantine v8** components using `@mantine/form` for form state and `@mantine/notifications` for toast feedback.

---

## 7. Browser Extension

The extension clips job postings from supported job boards into CareerTracker with one click.

**Files:**
- `manifest.json` — Manifest V3 definition; declares `content_scripts` for supported URLs and popup
- `content.js` — Injected into LinkedIn, Indeed, Glassdoor, and Naukri pages; scrapes job title, company, location, and description from the DOM, and posts the data back to `popup.js` via `chrome.runtime.sendMessage`
- `popup.html` / `popup.js` — Extension popup UI; handles OTP auth flow (same as web app), form pre-fill from scraped data, and calls `POST /jobs/` to create the application
- `background.js` — Service worker; manages session state
- `create_icons.py` — Generates `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` using Pillow

**Supported job boards:** LinkedIn, Indeed, Glassdoor, Naukri (falls back to URL-only on other pages)

**API endpoints used by extension:**

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/users/send-otp/` | Send OTP email |
| POST | `/api/users/verify-otp/` | Verify OTP, get JWT tokens |
| POST | `/api/refresh/` | Refresh access token |
| POST | `/api/jobs/` | Create job application |

**Backend URL** is configurable in extension settings (⚙️ tab) — update this after deploying to Render.

---

## 8. Deployment

### Backend — Railway

Configuration files: `Procfile`, `nixpacks.toml`, `railpack.toml`, `railway.json`

**Procfile:**
```
web: gunicorn careertracker.wsgi --bind 0.0.0.0:$PORT
```

Railway automatically injects `DATABASE_URL` (PostgreSQL), `PORT`, and other environment variables. The `settings.py` uses `dj-database-url` to parse `DATABASE_URL` and switch from SQLite to PostgreSQL automatically.

**Production security settings** (active when `DEBUG=False`):
- `SECURE_SSL_REDIRECT = False` (Railway handles SSL termination at load balancer)
- `SECURE_HSTS_SECONDS = 31536000`
- `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
- Secure cookies for sessions and CSRF

### Frontend — Vercel

Configuration: `frontend/vercel.json`

Build command: `npm run build` (`tsc -b && vite build`)  
Output directory: `dist/`  
Set `VITE_API_URL` environment variable to the Railway backend URL.

---

## 9. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend

```bash
# 1. Create and activate virtual environment
cd careertracker
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file (see Environment Variables section)
# Place .env in careertracker/ (same folder as manage.py)

# 4. Run migrations
python manage.py migrate

# 5. (Optional) Create admin user
python manage.py createsuperuser

# 6. Start dev server
python manage.py runserver
# API available at http://localhost:8000/api/
# Admin at http://localhost:8000/admin/
# Swagger at http://localhost:8000/api/schema/swagger-ui/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173/
```

### Browser Extension

```bash
cd browser-extension
pip install pillow
python create_icons.py   # generates icons/

# Chrome/Edge:
# 1. chrome://extensions → Enable Developer Mode
# 2. Load unpacked → select browser-extension/ folder

# Firefox:
# 1. about:debugging#/runtime/this-firefox
# 2. Load Temporary Add-on → select manifest.json
```

---

## 10. Environment Variables

Create a `.env` file in the `careertracker/` directory (alongside `manage.py`):

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (omit to use SQLite locally)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Email (Gmail SMTP)
EMAIL_HOST_USER=your-gmail-address@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
```

> **Gmail App Password:** In Gmail → Account → Security → 2FA enabled → App Passwords → generate one. Do NOT use your regular Gmail password.

**Frontend (`.env` in `frontend/`):**

```env
VITE_API_URL=http://localhost:8000/api/
```

**Render (set in Render dashboard):**

| Variable | Value |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `False` |
| `DATABASE_URL` | Auto-injected by Render PostgreSQL |
| `EMAIL_HOST_USER` | Gmail address |
| `EMAIL_HOST_PASSWORD` | Gmail app password |

**Vercel (set in Vercel dashboard):**

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-render-backend.onrender.com/api/` |
