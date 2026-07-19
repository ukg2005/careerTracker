# Docker Deployment Guide for Career Tracker

## Quick Start

### Prerequisites
- Docker installed (https://www.docker.com/products/docker-desktop)
- Docker Compose (usually included with Docker Desktop)
- Git

### Local Development Deployment

1. **Clone and navigate to the project:**
   ```bash
   cd careertracker
   ```

2. **Create / Update environment file:**
   ```bash
   # The .env file is already created with default values
   # For production, update the following in .env:
   # - SECRET_KEY: Generate a new Django secret key
   # - DEBUG: Set to False
   # - ALLOWED_HOSTS: Add your domain
   # - DB_PASSWORD: Change the database password
   # - CORS_ALLOWED_ORIGINS: Update with your domain
   ```

3. **Build and start the containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Run Django migrations (if needed):**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin
   - Nginx (all routes): http://localhost:80

### Services Overview

The docker-compose setup includes:

- **PostgreSQL (db)**: Database service on port 5432
- **Django Backend (backend)**: REST API on port 8000
- **SvelteKit Frontend (frontend)**: SvelteKit app on port 3000
- **Nginx (nginx)**: Reverse proxy on port 80

### Common Commands

```bash
# View logs
docker-compose logs -f [service_name]
# Example: docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (warning: deletes database!)
docker-compose down -v

# Rebuild specific service
docker-compose build [service_name]

# Run Django management commands
docker-compose exec backend python manage.py [command]

# Access backend shell
docker-compose exec backend python manage.py shell

# Connect to database
docker-compose exec db psql -U postgres -d careertracker
```

## Production Deployment

### On a Linux Server (AWS, DigitalOcean, etc.)

1. **Install Docker and Docker Compose:**
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

2. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd careertracker
   ```

3. **Update .env for production:**
   ```bash
   # Generate a secure SECRET_KEY
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   
   # Update .env with:
   # - SECRET_KEY: Paste the generated key
   # - DEBUG=False
   # - ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   # - DB_PASSWORD: Use a strong password
   # - CORS_ALLOWED_ORIGINS=https://yourdomain.com
   ```

4. **Start with production settings:**
   ```bash
   docker-compose up -d --build
   ```

5. **Setup SSL with Let's Encrypt (using Certbot):**
   ```bash
   # Install certbot
   sudo apt-get install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   
   # The certificates will be at /etc/letsencrypt/live/yourdomain.com/
   
   # Update nginx.conf to use SSL (uncomment the SSL sections)
   # Update the certificate paths in nginx.conf
   ```

6. **Setup Nginx with SSL:**
   - Uncomment the HTTPS sections in `nginx.conf`
   - Update certificate paths
   - Restart Nginx:
   ```bash
   docker-compose restart nginx
   ```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| DEBUG | False | Django debug mode |
| SECRET_KEY | required | Django secret key (generate new for production) |
| ALLOWED_HOSTS | * | Comma-separated list of allowed hosts |
| DB_NAME | careertracker | PostgreSQL database name |
| DB_USER | postgres | PostgreSQL user |
| DB_PASSWORD | postgres | PostgreSQL password |
| CORS_ALLOWED_ORIGINS | localhost:3000 | Comma-separated CORS origins |
| VITE_API_URL | http://backend:8000/api | Frontend API endpoint |

## Troubleshooting

### Database connection error
```bash
# Check PostgreSQL status
docker-compose logs db

# Recreate database
docker-compose down -v
docker-compose up -d
```

### Port already in use
```bash
# Change port in docker-compose.yml
# Example: "8001:8000" instead of "8000:8000"
```

### Static files not loading
```bash
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose restart backend
```

### Frontend can't connect to API
- Check CORS_ALLOWED_ORIGINS in .env
- Clear browser cache
- Check backend logs: `docker-compose logs backend`

## Deployment Checklist

- [ ] Update SECRET_KEY in .env
- [ ] Set DEBUG=False
- [ ] Update ALLOWED_HOSTS
- [ ] Update CORS_ALLOWED_ORIGINS
- [ ] Change database password
- [ ] Run migrations
- [ ] Collect static files
- [ ] Setup SSL/HTTPS
- [ ] Configure email settings
- [ ] Setup backups for database
- [ ] Monitor logs and performance

## Backup and Restore

### Backup database
```bash
docker-compose exec db pg_dump -U postgres careertracker > backup.sql
```

### Restore database
```bash
docker-compose exec -T db psql -U postgres careertracker < backup.sql
```

## Scaling (Advanced)

To run multiple backend instances with load balancing:
1. Modify docker-compose.yml to use `deploy` with replicas
2. Or use Docker Swarm/Kubernetes for advanced orchestration

## Support

- Django Docs: https://docs.djangoproject.com/
- Docker Docs: https://docs.docker.com/
- SvelteKit Docs: https://kit.svelte.dev/
