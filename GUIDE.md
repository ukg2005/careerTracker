# CareerTracker — Comprehensive Implementation Guide

This guide explains **how and why** every feature in this project works.
The goal is that after reading this, you could rebuild it from scratch without AI help.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Django Fundamentals](#2-django-fundamentals)
3. [Django REST Framework (DRF)](#3-django-rest-framework-drf)
4. [Authentication — OTP + JWT](#4-authentication--otp--jwt)
5. [Models & Migrations](#5-models--migrations)
6. [Serializers](#6-serializers)
7. [Views & URL Routing (Backend)](#7-views--url-routing-backend)
8. [Permissions & Security](#8-permissions--security)
9. [File Uploads & Media Files](#9-file-uploads--media-files)
10. [Frontend — React + Vite + TypeScript](#10-frontend--react--vite--typescript)
11. [Axios & the API Layer](#11-axios--the-api-layer)
12. [React Router & Navigation](#12-react-router--navigation)
13. [Mantine UI Components](#13-mantine-ui-components)
14. [Forms with @mantine/form](#14-forms-with-mantineform)
15. [Common Bugs & Why They Happen](#15-common-bugs--why-they-happen)

---

## 1. Project Structure

```
careerTracker/
├── careertracker/          ← Django project (config)
│   ├── settings.py         ← All configuration (DB, email, JWT, installed apps)
│   ├── urls.py             ← Root URL dispatcher
│   ├── wsgi.py / asgi.py   ← Server entry points (you rarely touch these)
│
├── jobs/                   ← Django app: job applications, documents, interviews
│   ├── models.py           ← Database table definitions
│   ├── serializers.py      ← Convert models ↔ JSON
│   ├── views.py            ← Handle HTTP requests
│   ├── urls.py             ← URL patterns for this app
│   ├── admin.py            ← Register models for Django admin panel
│   └── migrations/         ← Auto-generated DB schema history
│
├── users/                  ← Django app: auth, OTP, profile
│   └── (same structure as jobs/)
│
└── frontend/               ← React app (completely separate from Django)
    └── src/
        ├── App.tsx          ← Route definitions
        ├── api.ts           ← Axios instance (base URL, interceptors)
        └── pages/           ← One file per page/component
```

**Key concept:** Django and React are two completely separate programs. Django runs on port 8000 and serves JSON. React runs on port 5173 and serves HTML/JS. They communicate only through HTTP requests.

---

## 2. Django Fundamentals

### The Request/Response Cycle

Every HTTP request follows this path:

```
Browser Request
    → urls.py (matches URL pattern)
    → view function/class (your logic)
    → Response (JSON, HTML, etc.)
```

### Apps

Django projects are split into "apps" — self-contained modules. This project has two:
- `jobs` — everything about job applications
- `users` — everything about authentication and profiles

You register apps in `settings.py` under `INSTALLED_APPS`. If you forget this, migrations won't run and models won't be recognized.

### settings.py — The important parts

```python
INSTALLED_APPS = [
    ...
    'rest_framework',           # Enables DRF
    'corsheaders',              # Allows React (port 5173) to call Django (port 8000)
    'django_filters',           # Enables filtering on list views
    'jobs',                     # Your apps
    'users',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # Single file database, fine for development
    }
}

# Email (used for OTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '...'
EMAIL_HOST_PASSWORD = '...'   # App password, not your real Gmail password

# Where uploaded files are stored
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## 3. Django REST Framework (DRF)

DRF is a library that makes it easy to build JSON APIs on top of Django.

### The 3 core pieces you always use together:

| Piece | What it does | File |
|---|---|---|
| Model | Defines database table | `models.py` |
| Serializer | Converts model instance ↔ Python dict ↔ JSON | `serializers.py` |
| View | Handles the request, uses serializer | `views.py` |

### Generic Views — the shortcut

Instead of writing all CRUD logic yourself, DRF provides pre-built view classes:

```python
from rest_framework import generics

# GET list + POST create
class JobListView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()

# GET single + PATCH update + DELETE
class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()
```

Each class handles HTTP verbs automatically:
- `ListCreateAPIView`: GET → list, POST → create
- `RetrieveUpdateDestroyAPIView`: GET → single item, PUT/PATCH → update, DELETE → delete

You override methods like `get_queryset()` and `perform_create()` to add custom logic.

### get_queryset() — Why it exists

The default queryset returns ALL records from the database. You override it to filter by the current user:

```python
def get_queryset(self):
    # Only return jobs belonging to the logged-in user
    return JobApplication.objects.filter(user=self.request.user)
```

Without this, any authenticated user could read anyone else's data.

### perform_create() — Why it exists

When you POST to create a new record, the request body contains the data. But `user` is not in the request body (the client shouldn't be able to set their own user ID). So you inject it server-side:

```python
def perform_create(self, serializer):
    serializer.save(user=self.request.user)
    # This adds user=<current user> to the data before saving to DB
```

---

## 4. Authentication — OTP + JWT

### Why OTP instead of password?

No password storage = less security risk. User provides email → receives a 6-digit code → code is validated → they get tokens.

### The full OTP flow:

**Step 1: User submits email → `POST /api/users/send-otp/`**

```python
@api_view(['POST'])
@permission_classes([AllowAny])   # No token needed for this endpoint
def send_otp(request):
    email = request.data.get('email')
    otp = str(random.randint(100000, 999999))
    EmailOTP.objects.create(email=email, otp=otp)   # Save to DB
    send_mail(subject='OTP', message=f'Your OTP: {otp}', ...)
    return Response({'message': 'otp sent'})
```

**Step 2: User submits email + OTP → `POST /api/users/verify-otp/`**

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    record = EmailOTP.objects.filter(email=email, otp=otp).last()
    if not record:
        return Response({'error': 'Invalid OTP'})
    if record.created_at < now() - timedelta(minutes=5):
        return Response({'error': 'Expired OTP'})

    # Create user if first time, otherwise fetch existing
    user, created = User.objects.get_or_create(email=email, username=email)

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    })
```

### JWT (JSON Web Tokens)

JWT is a way to prove who you are without storing session data on the server.

**Two tokens are issued:**
- **Access token** — short-lived (e.g. 5 minutes). Sent with every API request.
- **Refresh token** — long-lived (e.g. 1 day). Used to get a new access token when the old one expires.

**How a protected request works:**
```
Client → HTTP Request with header: Authorization: Bearer <access_token>
                                                        ↓
Django → rest_framework_simplejwt extracts the token
       → Decodes it to get user ID
       → Sets request.user automatically
       → Your view runs with request.user available
```

**SimpleJWT settings in settings.py:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
```

**Token refresh:**
When the access token expires, the frontend sends the refresh token to `/api/token/refresh/` to get a new access token. This is handled automatically in `api.ts` via an Axios interceptor (see section 11).

---

## 5. Models & Migrations

### What is a model?

A model is a Python class that maps directly to a database table. Each attribute = one column.

```python
class JobApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # ForeignKey = "belongs to a user". CASCADE = if user deleted, delete their jobs too.

    job_title = models.CharField(max_length=200)
    # CharField = VARCHAR in SQL. max_length is required.

    salary_est = models.IntegerField(blank=True, null=True)
    # blank=True → form validation: field is optional
    # null=True  → database: column can store NULL
    # You need BOTH for optional numeric/date fields.
    # For text fields, prefer blank=True without null=True (store '' instead of NULL).

    status = models.CharField(max_length=10, choices=STATUS_TYPES)
    # choices restricts what values are allowed in Django admin / forms
    # Does NOT enforce at DB level — validation must happen in serializer/view
```

### Relationships

```python
# One-to-many: One JobApplication has many JobDocuments
job = models.ForeignKey(JobApplication, on_delete=models.CASCADE)

# One-to-one: One User has one Profile
user = models.OneToOneField(User, on_delete=models.CASCADE)
```

### Migrations

Migrations are Django's way of keeping the database schema in sync with your models.

**Workflow:**
```bash
# 1. You change models.py
# 2. Generate migration file (detects what changed)
python manage.py makemigrations

# 3. Apply the migration to the actual database
python manage.py migrate
```

Migration files live in `migrations/`. They are auto-generated — don't edit them manually unless you know exactly what you're doing. Always commit them to version control.

**Why migrations exist:** The database is separate from your code. The DB has a schema (table structure). When you add a field to a model, the DB doesn't know about it until you run a migration.

---

## 6. Serializers

A serializer does two things:
1. **Serialization**: Model instance → Python dict → JSON (for API responses)
2. **Deserialization**: JSON → Python dict → validated data → Model instance (for saving)

### Basic serializer:

```python
from rest_framework import serializers
from .models import JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = '__all__'          # Include all model fields in JSON
        read_only_fields = ('user',) # Client can't set this — we set it in perform_create
```

### Why read_only_fields?

If `user` is not read-only, a client could POST `{"user": 5, ...}` and create a job record belonging to user ID 5. Making it read-only means the serializer ignores any `user` value from the request body — the view sets it explicitly.

### Custom validation:

```python
class JobDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDocument
        fields = '__all__'

    def validate_job(self, value):
        # 'value' is the JobApplication instance from the submitted job ID
        request = self.context['request']
        if value.user != request.user:
            raise serializers.ValidationError("You don't own this job.")
        return value
```

`validate_<fieldname>` is called automatically on that specific field during deserialization. If you raise `ValidationError`, DRF returns a 400 response with the error message.

---

## 7. Views & URL Routing (Backend)

### URL structure

Root `careertracker/urls.py` dispatches to app-level URL files:

```python
urlpatterns = [
    path('api/jobs/', include('jobs.urls')),
    path('api/users/', include('users.urls')),
]
```

`jobs/urls.py` defines the specific patterns:

```python
urlpatterns = [
    path('', views.JobListView.as_view()),           # /api/jobs/
    path('<int:pk>/', views.JobDetailView.as_view()), # /api/jobs/42/
    path('interviews/', views.InterviewListView.as_view()),
]
```

`<int:pk>` is a URL parameter. DRF's generic views use it automatically to look up the object via `get_queryset().filter(pk=pk)`.

### Function-based vs class-based views

In this project, OTP views are **function-based** because they have custom logic that doesn't fit the generic CRUD pattern:

```python
@api_view(['POST'])           # Only allow POST requests
@permission_classes([AllowAny])  # Override default auth requirement
def send_otp(request):
    ...
    return Response({...})
```

Everything else is **class-based** using DRF generics, because they're standard CRUD operations and generics eliminate boilerplate.

### Filtering, Search, Ordering

```python
class JobListView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source']  # Exact match: ?status=APPLIED
    search_fields = ['company', 'job_title'] # Substring: ?search=google
    ordering_fields = ['applied_at']         # Sort: ?ordering=-applied_at (- = descending)
```

These translate directly to query parameters the frontend can pass to the API.

---

## 8. Permissions & Security

### Default permission

In `settings.py`:
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

This means every single view requires a valid JWT token by default. You override this only for public endpoints:

```python
@permission_classes([AllowAny])  # Function-based view
# or
permission_classes = [AllowAny]  # Class-based view attribute
```

### CORS (Cross-Origin Resource Sharing)

The browser blocks JavaScript from calling a different "origin" (domain+port) by default. Since React runs on `localhost:5173` and Django on `localhost:8000`, they are different origins.

`django-corsheaders` adds the HTTP headers that tell the browser "this is allowed":

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
```

Without this, every Axios request from React would be silently blocked by the browser before it even reaches Django.

---

## 9. File Uploads & Media Files

### How file uploads work

When uploading a file, you can't use JSON. You must use `multipart/form-data` encoding.

**Frontend — never set Content-Type manually:**
```typescript
const formData = new FormData();
formData.append('file', file);         // actual file object
formData.append('doc_types', 'RESUME');
formData.append('job', '42');

// DO NOT set headers: { 'Content-Type': 'multipart/form-data' }
// Let the browser set it automatically — it needs to include a "boundary" string
// that separates fields, and only the browser knows what that boundary is.
await api.post('jobs/documents/', formData);
```

**Backend — FileField on the model:**
```python
file = models.FileField(upload_to='job_documents/')
# Saves the file to MEDIA_ROOT/job_documents/filename
# Stores the relative path in the DB column
```

### Serving uploaded files in development

Django does not serve media files by default — that's intentional (in production, a web server like Nginx handles it). For development, you add this to the **root** `urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [...] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Why root urls.py and not jobs/urls.py?** The `static()` helper adds a URL pattern for `/media/*`. This URL is global — it doesn't belong to any app. Putting it in `jobs/urls.py` would scope it under `/api/jobs/media/` which is wrong. It must be in the root url configuration.

---

## 10. Frontend — React + Vite + TypeScript

### Component model

Every `.tsx` file is a component — a function that returns JSX (HTML-like syntax).

```tsx
export default function Dashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);  // State: data that triggers re-render when changed

    useEffect(() => {
        fetchJobs();  // Side effect: runs after the component renders
    }, []);           // Empty array = run once on mount only

    return <div>...</div>;
}
```

### Key React concepts used in this project

**useState** — local component data:
```tsx
const [loading, setLoading] = useState(false);
// loading = current value
// setLoading = function to update it (triggers re-render)
```

**useEffect** — run code after render:
```tsx
useEffect(() => {
    fetchJobs(); // run this...
}, [jobId]);     // ...whenever jobId changes (or once if [])
```

**Props** — pass data from parent to child component:
```tsx
// Parent passes jobId:
<InterviewsSection jobId={id!} />

// Child receives it:
export default function InterviewsSection({ jobId }: { jobId: string }) {
```

### Why nested `<form>` tags break things

HTML does not allow a `<form>` inside another `<form>`. The browser silently ignores the inner one — its submit button doesn't work, and `form.onSubmit` never fires.

This is why `<InterviewsSection>` must be placed **outside** the main job details `<form>` tag. The section has its own form (the schedule interview modal), which would be nested if placed inside.

---

## 11. Axios & the API Layer

`api.ts` creates a custom Axios instance so you don't repeat configuration everywhere:

```typescript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

// REQUEST interceptor — runs before every request is sent
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Adds: Authorization: Bearer eyJhbGci...
    }
    return config;
});

// RESPONSE interceptor — runs when a response is received
api.interceptors.response.use(
    (response) => response,  // Success: pass through
    async (error) => {
        if (error.response?.status === 401) {
            // Access token expired — try to refresh
            const refresh = localStorage.getItem('refresh_token');
            const res = await axios.post('http://localhost:8000/api/token/refresh/', { refresh });
            localStorage.setItem('access_token', res.data.access);
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${res.data.access}`;
            return axios(error.config);
        }
        return Promise.reject(error);
    }
);

export default api;
```

**Why interceptors?** Without them, you'd have to manually add the `Authorization` header to every single API call, and handle 401 token expiry in every catch block. Interceptors handle it in one place.

---

## 12. React Router & Navigation

`App.tsx` defines all page routes:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/jobs/:id' element={<JobDetails />} />
                <Route path='*' element={<Navigate to='/login' replace />} />
            </Routes>
        </BrowserRouter>
    );
}
```

`:id` is a URL parameter. In `JobDetails.tsx`, you read it with:
```tsx
const { id } = useParams();  // id = "42" as a string
```

**Navigating programmatically:**
```tsx
const navigate = useNavigate();
navigate('/dashboard');        // Go to dashboard
navigate(-1);                  // Go back
```

### Route Guards (PrivateRoute pattern)

A route guard checks for a token and redirects to login if missing:

```tsx
function PrivateRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem('access_token');
    return token ? children : <Navigate to='/login' replace />;
}

// Usage in App.tsx:
<Route path='/dashboard' element={<PrivateRoute><Dashboard /></PrivateRoute>} />
```

Without this, unauthenticated users can visit `/dashboard` directly — the page will just show an empty list (because the API returns 401 and the error is swallowed).

---

## 13. Mantine UI Components

Mantine is the component library used for all UI elements. Key components in this project:

| Component | What it renders |
|---|---|
| `Container` | Centered, max-width wrapper |
| `Paper` | White card with optional border/shadow |
| `Grid` / `Grid.Col` | Responsive column layout |
| `Group` | Horizontal flex row |
| `Stack` | Vertical flex column |
| `Modal` | Overlay dialog — **must be outside any `<form>`** |
| `Select` | Dropdown with predefined options |
| `TextInput` / `Textarea` | Text fields |
| `Badge` | Colored label chip |
| `Timeline` / `Timeline.Item` | Vertical timeline |
| `notifications.show()` | Toast notification (needs `Notifications` in App) |

### Why Mantine Modal sometimes doesn't appear

Mantine's Modal renders into a portal — it appends itself to `document.body` at the DOM level, outside your component tree. However:
- If the modal is inside a `<form>`, the browser may not render it correctly
- If a parent element has `overflow: hidden` or `position: relative` with a z-index conflict, the modal can be invisible even though it's "open"

When Mantine Modal fails: replace with a plain HTML `div` with `position: fixed` as a fallback. This bypasses all CSS stacking context issues.

---

## 14. Forms with @mantine/form

```tsx
const form = useForm({
    initialValues: {
        company: '',
        salary_est: '',    // Store as string in the form (TextInput is always a string)
    },
    validate: {
        company: (value) => value.length < 1 ? 'Required' : null,
    },
});

// Bind to an input:
<TextInput {...form.getInputProps('company')} />
// This spreads: { value, onChange, onBlur, error }

// Handle submit:
<form onSubmit={form.onSubmit(handleSubmit)}>
// handleSubmit only fires if all validate functions pass
```

### The empty string vs null problem

HTML inputs always give you strings. `<TextInput type="number" />` gives you `"42"` or `""`.

Django's `IntegerField` accepts integers and `None` (null), but rejects `""` (empty string) — that causes a **400 Bad Request**.

**The fix — convert before sending:**
```typescript
const handleUpdate = async (values: typeof form.values) => {
    const payload = {
        ...values,
        salary_est: values.salary_est === '' ? null : Number(values.salary_est),
    };
    await api.patch(`jobs/${id}/`, payload);
};
```

**The reverse problem — null to input:**
```typescript
// When loading data into the form:
salary_est: response.data.salary_est != null ? String(response.data.salary_est) : '',
// Can't pass null to a TextInput — it will become "null" as a string
// Convert to '' so the input shows as empty
```

---

## 15. Common Bugs & Why They Happen

### 400 Bad Request on PATCH/POST

The serializer rejected your data. Check `error.response?.data` in the console — DRF always returns exactly which field failed and why.

Common causes:
- Sending `""` for an `IntegerField` or `DateTimeField` (should be `null`)
- Sending a field that doesn't exist on the model (`round_name` on `Interview`)
- Missing a required field (`meeting_link` on Interview has no `blank=True`)

### 401 Unauthorized

The request didn't have a valid token. Common causes:
- Forgot `@permission_classes([AllowAny])` on a public view
- Token expired and refresh failed
- `localStorage` was cleared

### 403 Forbidden

Authenticated but not allowed. Usually means you're trying to access another user's resource. Check `get_queryset()` returns only `filter(user=request.user)`.

### 404 Not Found

Either the URL is wrong, or the object doesn't exist for that user. DRF generic views return 404 if `get_queryset()` returns no results for the given `pk`.

### File download 404

The file exists in `MEDIA_ROOT` but the URL isn't wired up. Make sure `+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)` is in the root `urls.py`, not an app's `urls.py`.

### Modal appears as a blur/overlay but the box doesn't show

Almost always a CSS stacking context problem — the modal box exists in the DOM but is hidden behind another element. The modal is inside a `<form>`, or a parent has `overflow: hidden`. Move the modal outside the form, or replace with a `position: fixed` div.

### Nested form — button does nothing

HTML ignores nested `<form>` tags. Any inputs and buttons inside the inner form are associated with the outer form, or with nothing. The `onSubmit` of the inner form never fires. The fix is always to restructure so no form is inside another form.
