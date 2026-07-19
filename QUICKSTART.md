# 🚀 Quick Start Guide for Docker Deployment

## Prerequisites
1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running (check system tray)

2. **Windows/Mac/Linux** with Docker and Docker Compose

## Deploy in 3 Steps

### Step 1: Start Docker Desktop
- On Windows/Mac: Open Docker Desktop application
- Wait for it to fully start (icon should be steady, not animated)
- Verify: Open PowerShell/Terminal and run `docker --version`

### Step 2: Build and Start
```bash
cd c:\programming\careerTracker

# Build the Docker images
docker-compose build

# Start all services
docker-compose up -d
```

### Step 3: Access Your App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **Nginx (all routes)**: http://localhost:80

## Database Setup (First Time Only)
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin account
docker-compose exec backend python manage.py createsuperuser
```

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Restart services
docker-compose restart

# Check container status
docker-compose ps

# Clean everything (removes database!)
docker-compose down -v
```

## Help Scripts (Windows)
```batch
docker-helper.bat build          # Build containers
docker-helper.bat up             # Start containers
docker-helper.bat down           # Stop containers
docker-helper.bat logs-backend   # View backend logs
docker-helper.bat migrate        # Run migrations
docker-helper.bat status         # Check status
docker-helper.bat help           # Show all commands
```

## Help Scripts (Mac/Linux)
```bash
chmod +x docker-helper.sh
./docker-helper.sh build          # Build containers
./docker-helper.sh up             # Start containers
./docker-helper.sh down           # Stop containers
./docker-helper.sh logs-backend   # View backend logs
./docker-helper.sh migrate        # Run migrations
./docker-helper.sh status         # Check status
./docker-helper.sh help           # Show all commands
```

## Troubleshooting

### Docker daemon not running
- **Windows/Mac**: Start Docker Desktop from applications menu
- **Linux**: Run `sudo systemctl start docker`

### Port already in use
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8001:8000"  # Change to different port like 8001
```

### Permission denied on Linux
```bash
sudo usermod -aG docker $USER
# Then logout and login
```

### Database connection failed
```bash
# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

## Environment Variables

Edit `.env` file to customize:
- `DEBUG`: Set to False for production
- `SECRET_KEY`: Change to secure value
- `ALLOWED_HOSTS`: Add your domain
- `DB_PASSWORD`: Change database password
- `CORS_ALLOWED_ORIGINS`: Add frontend URL

See `.env.example` for all available variables.

## Production Deployment

For deployment to cloud (AWS, DigitalOcean, etc.):
1. See `DOCKER_DEPLOY.md` for detailed instructions
2. Update environment variables for production
3. Setup SSL/HTTPS with Let's Encrypt
4. Configure domain and DNS

## Need More Help?

- Full deployment guide: See `DOCKER_DEPLOY.md`
- Docker docs: https://docs.docker.com/
- Django docs: https://docs.djangoproject.com/
- Svelte docs: https://svelte.dev/

---

**That's it! Your app should be running now! 🎉**
