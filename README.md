# CareerTracker

A full-stack job application tracking platform built to take the chaos out of the modern job hunt. Log every application, track interview rounds, attach documents, and get data-driven insight into your pipeline — all in one place.

**Live:** [careertracker.up.railway.app](https://careertracker.up.railway.app) · **Frontend:** [Vercel](https://career-tracker-wheat.vercel.app)

---

## What It Does

- **Application tracking** — log every job you apply to with status, confidence level, source, salary estimate, location, and a direct application link
- **Interview management** — schedule interview rounds (HR, Behavioural, Technical, Managerial, GD), add meeting links, record feedback, and rate each round
- **Document vault** — attach resumes, cover letters, and cold emails to individual applications
- **Analytics dashboard** — see your offer rate, interview rate, and rejection rate at a glance; visualise your pipeline with a full status breakdown
- **OTP email authentication** — passwordless login; receive a 6-digit OTP, verify, and get a JWT token pair
- **Browser extension** — clip job postings from LinkedIn, Indeed, Glassdoor, and Naukri directly into the tracker with one click

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6 · Django REST Framework 3.16 · PostgreSQL |
| Auth | SimpleJWT (60-min access / 7-day refresh) · OTP email flow |
| Frontend | React 19 · TypeScript · Vite · Mantine UI v8 · React Router v7 |
| Browser Extension | Chrome MV3 (Manifest V3) · content scripts · service worker |
| Deployment | Railway (backend + DB) · Vercel (frontend) · Gunicorn · WhiteNoise |
| API Docs | drf-spectacular (OpenAPI 3) |

---

## Architecture

```
┌─────────────────────────┐      HTTPS / JWT       ┌────────────────────────┐
│   React Frontend        │◄──────────────────────►│  Django REST API       │
│   (Vercel)              │                         │  (Railway)             │
│                         │                         │                        │
│  pages/                 │                         │  /api/jobs/            │
│   ├── Login.tsx         │                         │  /api/jobs/<id>/       │
│   ├── Dashboard.tsx     │                         │  /api/jobs/stats/      │
│   ├── JobDetails.tsx    │                         │  /api/interviews/      │
│   ├── Analytics.tsx     │                         │  /api/documents/       │
│   ├── Profile.tsx       │                         │  /api/users/profile/   │
│   ├── InterviewSection  │                         │  /api/users/auth/      │
│   └── DocumentSection   │                         │                        │
└─────────────────────────┘                         └──────────┬─────────────┘
                                                               │
┌─────────────────────────┐                         ┌──────────▼─────────────┐
│  Browser Extension      │  POST /api/jobs/        │  PostgreSQL            │
│  (Chrome / Firefox)     │────────────────────────►│  (Railway)             │
│  content.js scrapes DOM │                         └────────────────────────┘
└─────────────────────────┘
```

---

## Data Models

### `JobApplication`
The core entity. Tracks every attribute of a job application:

| Field | Type | Notes |
|---|---|---|
| `job_title` | CharField | |
| `company` | CharField | |
| `status` | CharField | `APPLIED · INTERVIEW · OFFER · REJECTED · GHOSTED · REPLIED` |
| `confidence` | CharField | `HIGH · MEDIUM · LOW` |
| `source` | CharField | LinkedIn, Referral, Job Portal, Campus, Recruiter… |
| `salary_est` | IntegerField | Optional |
| `application_link` | URLField | Optional |
| `contacts` | CharField | Recruiter / referral contact |
| `notes` | TextField | Freeform notes |

### `Interview`
Linked to a `JobApplication`. Tracks rounds separately so multiple rounds per application are supported:

| Field | Notes |
|---|---|
| `type` | HR, Behavioural, Technical, Managerial, GD, Others |
| `interview_at` | DateTime |
| `interview_with` | Interviewer name |
| `meeting_link` | Zoom / Meet URL |
| `feedback` | Post-round notes |
| `rating` | 0–5 |
| `remainder_sent` | Boolean flag |

### `JobDocument`
File upload linked to a `JobApplication`:

| Field | Notes |
|---|---|
| `file` | Stored under `job_documents/` |
| `doc_types` | Resume, Cover Letter, Cold Email, Others |

### `Profile`
One-to-one with Django's built-in `User`:

| Field | Notes |
|---|---|
| `target_role` | What role the user is hunting for |
| `skills` | Comma-separated list |
| `years_exp` | Integer |
| `linkedin_url · portfolio_url · github_url` | Optional links |

---

## API Reference

All endpoints require `Authorization: Bearer <access_token>` except the OTP auth endpoints.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users/auth/request-otp/` | Send a 6-digit OTP to the given email |
| `POST` | `/users/auth/verify-otp/` | Verify OTP → return `access` + `refresh` JWT pair |
| `POST` | `/users/auth/token/refresh/` | Refresh an expired access token |
| `GET · POST` | `/jobs/` | List (with search/filter/order) or create a job application |
| `GET · PATCH · DELETE` | `/jobs/<id>/` | Retrieve, update, or delete a single application |
| `GET` | `/jobs/stats/` | Aggregated analytics for the logged-in user |
| `GET · POST` | `/interviews/` | List or create interview rounds |
| `GET · PATCH · DELETE` | `/interviews/<id>/` | Retrieve, update, or delete an interview |
| `GET · POST` | `/documents/` | List or upload job documents |
| `GET · PATCH · DELETE` | `/documents/<id>/` | Retrieve, update, or delete a document |
| `GET · PATCH` | `/users/profile/` | Get or update the user profile |

**Query parameters on `GET /jobs/`:**

| Param | Type | Example |
|---|---|---|
| `search` | string | `?search=google` — searches company, title, location, contacts, notes |
| `status` | string | `?status=INTERVIEW` |
| `source` | string | `?source=LINKEDIN` |
| `confidence` | string | `?confidence=HIGH` |
| `ordering` | string | `?ordering=-salary_est` |

---

## Key Design Decisions

**Passwordless OTP login** — job seekers use many devices and often share computers. Removing passwords reduces friction and removes the risk of credential reuse. OTP records expire after 5 minutes and are deleted after successful verification.

**JWT with short-lived access tokens** — 60-minute access tokens mean a stolen token has a narrow window. The refresh token enables seamless re-authentication without asking the user to log in again.

**Object-level ownership enforcement** — every queryset is filtered by `user=request.user`. The `JobDocument` upload endpoint additionally checks that the linked `JobApplication` belongs to the current user before saving, preventing IDOR.

**Flat status model** — rather than a complex state machine, applications use a simple choice field. This makes filtering, sorting, and analytics trivially easy while still capturing every meaningful state a recruiter pipeline produces.

**Single shared `aiohttp.ClientSession` pattern** (browser extension) — the extension reuses one session for all API calls per popup lifecycle, keeping connection overhead low.

---

## Getting Started

### Prerequisites

- Python 3.12+, Node.js 20+
- PostgreSQL (or SQLite for local dev)

### Backend

```bash
cd careertracker
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create a .env file (see .env.example)
cp .env.example .env

python manage.py migrate
python manage.py runserver
```

**`.env` variables:**

```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3          # or postgres://user:pass@host/db
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your@gmail.com
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000/api/
npm run dev
```

### Browser Extension

1. Generate icons: `pip install pillow && python browser-extension/create_icons.py`
2. Open `chrome://extensions/` → Enable Developer mode → **Load unpacked** → select `browser-extension/`
3. Click the extension icon, enter your email, verify the OTP

---

## Project Structure

```
careerTracker/
├── careertracker/              # Django project
│   ├── careertracker/          # Django settings, URLs, WSGI/ASGI
│   ├── jobs/                   # JobApplication, Interview, JobDocument
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── users/                  # Profile, EmailOTP, OTP auth views
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── signals.py          # Auto-creates Profile on User creation
│   └── requirements.txt
├── frontend/                   # React app
│   ├── src/
│   │   ├── pages/              # Dashboard, JobDetails, Analytics, Profile…
│   │   ├── components/         # Navbar
│   │   └── api.ts              # Axios instance with JWT interceptors
│   └── package.json
└── browser-extension/          # Chrome/Firefox MV3 extension
    ├── manifest.json
    ├── content.js              # DOM scraper for job boards
    ├── background.js           # Service worker — API calls, token refresh
    └── popup.html / popup.js   # Extension UI
```

---

## Deployment

The backend is deployed on **Railway** using `railpack.toml` / `railway.json`. Static files are served via WhiteNoise. The frontend is deployed on **Vercel** with `vercel.json`.

```
Backend:  https://careertracker.up.railway.app/api/
Frontend: https://career-tracker-wheat.vercel.app
```

---

## Things I'd Add Next

- Email/calendar reminders for upcoming interviews
- Resume-to-job-description match scoring (keyword overlap)
- Kanban board view (drag-and-drop status changes)
- Export to CSV / PDF
- Google OAuth login alongside OTP
