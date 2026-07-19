# 🎬 CareerTracker — Complete Interview Guide
*One document. Everything you need. No fluff.*

## 1. Elevator Pitch
"CareerTracker is a full-stack job application tracking and management system designed to streamline the job hunt pipeline. Users can monitor applications across stages (Applied, Interview, Offer), store essential documents (Resumes, Cover Letters), track interview schedules, and analyze conversion metrics via a rich dashboard. The backend is a Django REST Framework API backed by SQLite (production-ready for PostgreSQL), using custom OTP-based passwordless authentication and SimpleJWT. The frontend is a highly reactive SvelteKit SPA. The ecosystem is extended by a custom Vanilla JS Chrome Extension that scrapes job data and posts directly to the API, creating a seamless one-click save experience. The stack is fully containerized with Docker."

## 2. Motivation & Problem Statement
I'm actively participating in placement season and realized tracking hundreds of applications across dozens of portals in spreadsheets was inefficient, error-prone, and provided zero insights into my conversion rates. I built CareerTracker to solve my own problem.

Three guiding principles shaped everything:
1. **Frictionless Data Entry** — Never ask the user to manually type out job descriptions; the Chrome extension acts as the primary ingest point.
2. **Actionable Analytics** — Raw lists aren't enough. The dashboard must instantly calculate conversion rates across the application funnel.
3. **Decoupled & Secure** — True Client-Server architecture with REST APIs, passwordless OTP auth, and proper file storage semantics via Django's `MEDIA_URL`.

## 3. Technology Stack

### Backend
| Technology | Why |
| :--- | :--- |
| **Django 5** | Heavy lifting for ORM, file handling (FileField), and robust admin interface. |
| **Django REST Framework** | Industry-standard REST layer; serializers, generic views, and permissions. |
| **SimpleJWT** | Access + refresh tokens (stateless API auth). |
| **drf-spectacular** | Auto-generates OpenAPI → Swagger UI at `/api/schema/swagger-ui/`. |
| **django-cors-headers** | Allows the SvelteKit frontend (and Chrome extension) to hit Django endpoints. |
| **SQLite** | Dev database (zero config; production ready to swap to PostgreSQL). |
| **Docker + Compose** | Reproducible environment, orchestrating frontend, backend, and Nginx. |

### Frontend
| Technology | Why |
| :--- | :--- |
| **SvelteKit + TypeScript** | File-based routing, Svelte 5 `$state` runes for reactive primitives, zero virtual DOM overhead. |
| **TailwindCSS** | Utility-first styling. Clean, scalable, corporate aesthetic without heavy component libraries. |
| **Lucide-Svelte** | Lightweight SVG icons (replacing heavy raster/font icon packs for performance). |

### Browser Extension
| Technology | Why |
| :--- | :--- |
| **Manifest V3 + Vanilla JS** | Direct DOM access via Content Scripts. No framework overhead needed for simple DOM querying and `fetch` POST requests. |

## 4. Architecture

```
┌──────────────────────────┐   HTTP/REST   ┌──────────────────────────────┐
│  SvelteKit Frontend      │ ◄───────────► │  Django REST Framework       │
│  Tailwind + Fetch API    │               │  Port 8000                   │
│  Port 5173               │               └──────────────┬───────────────┘
└──────────────────────────┘                              │
                                     ┌────────────────────┼──────────────────┐
                                     │                    │                  │
┌──────────────────────────┐   POST  │             ┌──────▼─────┐     ┌──────▼──────┐
│  Chrome Extension        │ ────────┘             │  SQLite DB │     │ File System │
│  Manifest V3             │                       └────────────┘     │  (/media/)  │
└──────────────────────────┘                                          └─────────────┘
```

**2 Core Django Apps:**
| App | Responsibility |
| :--- | :--- |
| `users` | Custom `EmailOTP` logic, JWT token issuance, User Profile extension. |
| `jobs` | JobApplications, Interviews, Documents, and Analytics aggregation. |

## 5. Full API Reference

| Method | Endpoint | Auth | Notes |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/users/send-otp/` | No | Generates 6-digit code, saves to `EmailOTP`, dispatches email. |
| **POST** | `/api/users/verify-otp/` | No | Validates OTP. Creates user if new. Returns JWT access/refresh. |
| **GET/PATCH** | `/api/users/profile/` | Yes | Retrieves/updates the One-To-One `Profile` model. |
| **GET/POST** | `/api/jobs/` | Yes | List all jobs or create a new job application. |
| **GET/PATCH/DEL**| `/api/jobs/<pk>/` | Yes | CRUD for a specific job application. |
| **GET** | `/api/jobs/stats/` | Yes | Aggregates funnel metrics (Applied → Interview → Offer). |
| **GET/POST** | `/api/jobs/documents/` | Yes | Upload resumes/cover letters (`multipart/form-data`). |
| **GET** | `/api/jobs/documents/<pk>/` | Yes | Retrieve/Delete specific document references. |
| **GET/POST** | `/api/jobs/interviews/` | Yes | Track scheduled interviews per job. |

## 6. Database Models

### `users` app
* **`User`** — Django's built-in auth model.
* **`Profile`** — `user` (OneToOne), `first_name`, `last_name`, `bio`, `target_role`, `skills`, `linkedin_url`, `github_url`.
  * *Why OneToOne?* Decouples the core authentication credentials from the heavy user metadata.
* **`EmailOTP`** — `email`, `otp` (6-char string), `created_at`.
  * *Why Transient?* Used strictly for login state. Records are deleted upon successful validation or expire after 5 minutes.

### `jobs` app
* **`JobApplication`** — `user` (FK), `job_title`, `company`, `status` (Choices: APPLIED, INTERVIEW, OFFER, etc.), `source`, `confidence`, `applied_at`. 
* **`JobDocument`** — `job` (FK), `file` (FileField), `doc_types` (Resume, Cover Letter).
  * *Why FileField?* Never store binary BLOBs in a database. Django stores the string path (e.g., `job_documents/resume.pdf`) in the DB and saves the physical file to the local disk `MEDIA_ROOT`.
* **`Interview`** — `job` (FK), `interview_at`, `type` (HR, Technical), `feedback`, `rating`.

## 7. Backend Deep Dives

### 7.1 OTP Authentication Flow (Passwordless)
**Requesting OTP:**
```python
otp = str(random.randint(100000, 999999))
EmailOTP.objects.create(email=email, otp=otp)
send_mail(..., recipient_list=[email])
```
**Verification & Token Issuance:**
```python
record = EmailOTP.objects.filter(email=email, otp=otp).last()
if record.created_at < now() - timedelta(minutes=5):
    return Response({'error': 'Expired OTP'})

user, created = User.objects.get_or_create(username=email, defaults={'email': email})
refresh = RefreshToken.for_user(user)
EmailOTP.objects.filter(email=email).delete() # Prevent replay attacks
return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})
```
*Why this flow?* No passwords to hash or lose. `get_or_create` ensures seamless login/registration through a single pipeline. The `EmailOTP` record acts as a short-lived state machine, strictly deleted after 5 minutes or upon use.

### 7.2 Storage Architecture (Django Media)
Django's `MEDIA_URL` and `MEDIA_ROOT` are configured to handle user-uploaded files. The SvelteKit frontend uses a `getFileUrl()` helper to resolve relative paths returned by the API (e.g., `/media/job_documents/...`) into absolute URLs pointing to the Django server. This architecture is production-ready for object storage (like AWS S3) by simply swapping the Django Storage Backend, without altering any DB schema.

## 8. Frontend Deep Dives

### 8.1 Svelte 5 `$state` Runes
Replaced legacy Svelte stores and React-style hooks with Svelte 5's native reactivity runes. 
```svelte
let file: File | null = $state(null);
let loading = $state(true);
```
Changes to `$state` propagate automatically to the DOM with zero boilerplate, making complex components like the interactive Analytics Dashboard extremely performant.

### 8.2 Design System Overhaul
Shifted from flashy gradients and heavy icons to a corporate, data-centric UI.
* Used solid `bg-blue-600` for primary actions.
* Clean `#f8fafc` (slate) for application backgrounds.
* Added micro-animations (`transition-all duration-200`) to provide snappiness.
* **Why?** A job tracking tool must feel like a reliable utility, not a social media app. Fast renders and clean data presentation win.

### 8.3 Chrome Extension Content Scripts
The extension injects a Content Script into the active tab to read DOM nodes (`document.querySelector('.job-title').innerText`). The popup acts as an intermediary, capturing the token from local storage (or requiring login) and executing a `fetch` POST request directly to the `/api/jobs/` endpoint, completely bypassing manual data entry.

## 9. Challenges & Solutions

| Challenge | Root Cause | Solution |
| :--- | :--- | :--- |
| **File Download Resolution** | Django returns relative paths, but Svelte runs on a different port/host. | Implemented a dynamic `getFileUrl` resolver in Svelte that prepends the correct backend host (Local vs Docker vs Production). |
| **Extension UI/UX overflow** | Extension popup had no bounding box and relied on heavy gradients/icons. | Enforced strict `max-width/height`, added `overflow-y-auto`, and refactored to lightweight Lucide SVGs with solid corporate colors. |
| **Stateful Auth across apps** | The extension and the SPA both needed authentication without shared cookies. | CORS headers strictly configured to allow the specific Extension ID + Svelte localhost. JWT tokens passed explicitly via `Authorization: Bearer` headers. |

## 10. Interview Q&A

**Q: Why did you choose SvelteKit over React for the frontend?**
**A:** SvelteKit compiles away the framework step, resulting in smaller bundle sizes and no virtual DOM overhead. The new Svelte 5 `$state` runes made managing complex local states (like file uploads and dashboard filtering) incredibly intuitive and performant.

**Q: How does your file upload system work? Why not store files in the database?**
**A:** When a user uploads a resume, the Django backend saves the physical file to the local disk (in the `media/` folder) and saves only the string path reference in the database via a `FileField`. Storing files as BLOBs in the database causes DB bloat, slows down queries, and makes it impossible to serve files efficiently via a CDN. 

**Q: How does the Chrome extension securely talk to your API?**
**A:** The extension acts as an independent client. In Django, `django-cors-headers` is configured to explicitly allow the extension's unique ID. The extension maintains the JWT access token and injects it into the `Authorization` header on every `fetch` request to `/api/jobs/`.

**Q: Tell me about a significant UI/UX design decision you made.**
**A:** Initially, the app had a lot of gradients and flashy elements. I realized a productivity tool needs to feel professional, fast, and data-heavy. I refactored the design system to use solid corporate colors, added subtle micro-animations, and swapped heavy raster icons for SVGs. This drastically improved render performance and the premium feel of the app.

## 11. Concept Cheat Sheet

| Concept | Where in CareerTracker |
| :--- | :--- |
| **OneToOneField** | `User` ↔️ `Profile` |
| **ForeignKey (Cascade)** | `JobApplication` ↔️ `JobDocument` / `Interview` |
| **FileField** | Stores document paths, keeping binary data on disk. |
| **get_or_create** | Used in OTP validation to seamlessly login or register a user. |
| **$state** | Svelte 5 rune handling reactive UI data. |
| **TokenObtainPair** | SimpleJWT underlying mechanics for token issuance. |
| **Content Scripts** | Chrome extension JS injected into job boards to read DOM. |
| **CORS (Cross-Origin)** | Required to allow Svelte (port 5173) and Extension to hit Django (port 8000). |

## 12. Outcomes & Lessons

**Built**
* Fully decoupled REST API and SPA frontend, orchestrated with Docker.
* Passwordless OTP Authentication Flow with JWT stateless sessions.
* Functional Chrome Extension that scrapes data and writes directly to the database.
* Robust local file storage system mapped accurately through Django models to Svelte views.

**Key Lessons**
* **File Storage Semantics:** Databases are for structured data; disks/object stores are for files. Understanding how frameworks like Django map URLs (`MEDIA_URL`) to paths (`MEDIA_ROOT`) is critical for full-stack apps.
* **API Boundaries:** Building a Chrome Extension proved that a well-designed REST API can serve multiple radically different clients (SPA vs Extension) without modification, so long as CORS and Auth are handled correctly.

## 13. Say These Unprompted
* *"I explicitly chose to store file paths in the database and the binary data on disk to avoid DB bloat and remain CDN-ready."*
* *"The OTP system uses `get_or_create` on validation. It inherently handles both registration and login seamlessly in a single pipeline."*
* *"I migrated the design from flashy gradients to solid corporate colors and SVGs, prioritizing render performance and a 'utility-first' UX."*
* *"Building the Chrome Extension proved the viability of my decoupled architecture; the API didn't need to change at all to support a brand new client."*
