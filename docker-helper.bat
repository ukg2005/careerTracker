@echo off
REM Career Tracker Docker Helper Script for Windows
REM This script provides easy commands to manage the Docker containers

setlocal enabledelayedexpansion

if "%1%"=="" goto help
if /i "%1%"=="help" goto help
if /i "%1%"=="-h" goto help
if /i "%1%"=="--help" goto help

if /i "%1%"=="up" goto up
if /i "%1%"=="down" goto down
if /i "%1%"=="build" goto build
if /i "%1%"=="rebuild" goto rebuild
if /i "%1%"=="logs" goto logs
if /i "%1%"=="logs-backend" goto logs_backend
if /i "%1%"=="logs-frontend" goto logs_frontend
if /i "%1%"=="logs-db" goto logs_db
if /i "%1%"=="migrate" goto migrate
if /i "%1%"=="createsuperuser" goto createsuperuser
if /i "%1%"=="shell-backend" goto shell_backend
if /i "%1%"=="shell-db" goto shell_db
if /i "%1%"=="bash-backend" goto bash_backend
if /i "%1%"=="collectstatic" goto collectstatic
if /i "%1%"=="status" goto status
if /i "%1%"=="clean" goto clean

echo Unknown command: %1%
goto help

:up
echo [INFO] Starting containers...
docker-compose up -d
echo [INFO] Containers started successfully!
echo.
echo Access points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   Nginx:    http://localhost:80
echo   Admin:    http://localhost:8000/admin
goto end

:down
echo [INFO] Stopping containers...
docker-compose down
echo [INFO] Containers stopped.
goto end

:build
echo [INFO] Building containers...
docker-compose build
echo [INFO] Build completed!
goto end

:rebuild
echo [WARN] This will rebuild all containers from scratch.
set /p confirm="Continue? (y/n): "
if /i "%confirm%"=="y" (
    echo [INFO] Rebuilding containers...
    docker-compose build --no-cache
    echo [INFO] Build completed!
) else (
    echo [WARN] Build cancelled.
)
goto end

:logs
docker-compose logs -f
goto end

:logs_backend
docker-compose logs -f backend
goto end

:logs_frontend
docker-compose logs -f frontend
goto end

:logs_db
docker-compose logs -f db
goto end

:migrate
echo [INFO] Running Django migrations...
docker-compose exec backend python manage.py migrate
echo [INFO] Migrations completed!
goto end

:createsuperuser
echo [INFO] Creating superuser...
docker-compose exec backend python manage.py createsuperuser
goto end

:shell_backend
echo [INFO] Opening Django shell...
docker-compose exec backend python manage.py shell
goto end

:shell_db
echo [INFO] Connecting to database...
docker-compose exec db psql -U postgres -d careertracker
goto end

:bash_backend
echo [INFO] Opening backend container bash...
docker-compose exec backend /bin/bash
goto end

:collectstatic
echo [INFO] Collecting static files...
docker-compose exec backend python manage.py collectstatic --noinput
echo [INFO] Static files collected!
goto end

:status
echo [INFO] Container status:
docker-compose ps
goto end

:clean
echo [WARN] This will remove all containers and volumes!
set /p confirm="Continue? (y/n): "
if /i "%confirm%"=="y" (
    echo [INFO] Removing containers and volumes...
    docker-compose down -v
    echo [INFO] Cleanup completed!
) else (
    echo [WARN] Cleanup cancelled.
)
goto end

:help
echo Career Tracker Docker Helper
echo.
echo Usage: docker-helper.bat [COMMAND]
echo.
echo Commands:
echo   up              Start all containers
echo   down            Stop all containers
echo   build           Build containers (run this first)
echo   rebuild         Rebuild containers from scratch
echo   logs            View logs from all services
echo   logs-backend    View backend logs
echo   logs-frontend   View frontend logs
echo   logs-db         View database logs
echo   migrate         Run Django migrations
echo   createsuperuser Create admin user
echo   shell-backend   Access Django shell
echo   shell-db        Connect to database
echo   bash-backend    Access backend container bash
echo   collectstatic   Collect static files
echo   status          Show container status
echo   clean           Remove containers and volumes
echo   help            Show this help message
echo.
echo Examples:
echo   docker-helper.bat build
echo   docker-helper.bat up
echo   docker-helper.bat logs-backend
echo   docker-helper.bat migrate

:end
endlocal
