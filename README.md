# CareerTracker

CareerTracker is a full-stack job application and interview tracker with a Django REST backend, a React + Vite frontend, and an optional browser extension for clipping job postings into the app.

## What It Does

- Track job applications, statuses, contacts, notes, and source links
- Store interview rounds, feedback, ratings, and reminder flags
- Upload and manage documents such as resumes and cover letters
- Support OTP-based login with JWT authentication
- Show analytics for your job search progress
- Clip job postings from supported sites through the browser extension

## API Endpoints

### Authentication

- `POST /api/login/` - obtain JWT access and refresh tokens
- `POST /api/refresh/` - refresh an access token
- `POST /api/users/send-otp/` - send a login OTP to email
- `POST /api/users/verify-otp/` - verify the OTP and complete login
- `GET /api/users/profile/` - fetch the current user profile
- `PUT /api/users/profile/` - update the current user profile

### Jobs, Interviews, and Documents

- `GET /api/jobs/` - list job applications
- `POST /api/jobs/` - create a job application
- `GET /api/jobs/<id>/` - fetch a single job application
- `PATCH /api/jobs/<id>/` - update a job application
- `DELETE /api/jobs/<id>/` - delete a job application
- `GET /api/jobs/stats/` - get analytics and summary stats
- `GET /api/jobs/interviews/` - list interviews
- `POST /api/jobs/interviews/` - create an interview
- `GET /api/jobs/interviews/<id>/` - fetch a single interview
- `PATCH /api/jobs/interviews/<id>/` - update an interview
- `DELETE /api/jobs/interviews/<id>/` - delete an interview
- `GET /api/jobs/documents/` - list uploaded job documents
- `POST /api/jobs/documents/` - upload a document
- `GET /api/jobs/documents/<id>/` - fetch a document record
- `PATCH /api/jobs/documents/<id>/` - update a document record
- `DELETE /api/jobs/documents/<id>/` - delete a document record

### Docs

- `GET /api/schema/` - OpenAPI schema
- `GET /api/schema/swagger-ui/` - Swagger UI

## Project Structure

- `careertracker/` - Django project, app logic, and SQLite database
- `frontend/` - React + TypeScript user interface
- `browser-extension/` - Optional extension for job clipping
- `GUIDE.md` - Detailed implementation guide
- `DOCUMENTATION.md` - Full project documentation

## Prerequisites

- Python 3.11+ with virtual environment support
- Node.js 18+ and npm
- Chrome, Edge, or Firefox if you want to use the browser extension

## Backend Setup

```powershell
cd careertracker
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs on `http://127.0.0.1:8000/` by default.

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173/` by default.

## Browser Extension

To load the extension locally:

1. Open `browser-extension/`
2. Install the icon dependency if needed: `pip install pillow`
3. Run `python create_icons.py`
4. Load the folder as an unpacked extension in your browser

See `browser-extension/README.md` for the extension-specific setup and supported sites.

## More Documentation

- Read `DOCUMENTATION.md` for the full project breakdown
- Read `GUIDE.md` for a deeper explanation of how the backend and frontend work
- Read `careertracker/careertracker/urls.py` and `careertracker/jobs/urls.py` for the canonical API routing

## Notes

- The repository uses SQLite for local development
- Media uploads are stored under `careertracker/media/`
- The frontend and backend communicate over HTTP using the API defined by the Django app