#!/bin/bash

# Career Tracker Docker Helper Script
# This script provides easy commands to manage the Docker containers

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Career Tracker Docker Helper

Usage: ./docker-helper.sh [COMMAND]

Commands:
    up              Start all containers
    down            Stop all containers
    build           Build containers (run this first)
    rebuild         Rebuild containers from scratch
    logs            View logs from all services
    logs-backend    View backend logs
    logs-frontend   View frontend logs
    logs-db         View database logs
    migrate         Run Django migrations
    createsuperuser Create admin user
    shell-backend   Access Django shell
    shell-db        Connect to database
    bash-backend    Access backend container bash
    collectstatic   Collect static files
    status          Show container status
    clean           Remove containers and volumes
    help            Show this help message

Examples:
    ./docker-helper.sh build
    ./docker-helper.sh up
    ./docker-helper.sh logs-backend
    ./docker-helper.sh migrate
EOF
}

# Main command handling
case "${1:-help}" in
    up)
        print_info "Starting containers..."
        docker-compose up -d
        print_info "Containers started successfully!"
        echo ""
        echo "Access points:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:8000"
        echo "  Nginx:    http://localhost:80"
        echo "  Admin:    http://localhost:8000/admin"
        ;;
    
    down)
        print_info "Stopping containers..."
        docker-compose down
        print_info "Containers stopped."
        ;;
    
    build)
        print_info "Building containers..."
        docker-compose build
        print_info "Build completed!"
        ;;
    
    rebuild)
        print_warn "This will rebuild all containers from scratch."
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Rebuilding containers..."
            docker-compose build --no-cache
            print_info "Build completed!"
        else
            print_warn "Build cancelled."
        fi
        ;;
    
    logs)
        docker-compose logs -f
        ;;
    
    logs-backend)
        docker-compose logs -f backend
        ;;
    
    logs-frontend)
        docker-compose logs -f frontend
        ;;
    
    logs-db)
        docker-compose logs -f db
        ;;
    
    migrate)
        print_info "Running Django migrations..."
        docker-compose exec backend python manage.py migrate
        print_info "Migrations completed!"
        ;;
    
    createsuperuser)
        print_info "Creating superuser..."
        docker-compose exec backend python manage.py createsuperuser
        ;;
    
    shell-backend)
        print_info "Opening Django shell..."
        docker-compose exec backend python manage.py shell
        ;;
    
    shell-db)
        print_info "Connecting to database..."
        docker-compose exec db psql -U postgres -d careertracker
        ;;
    
    bash-backend)
        print_info "Opening backend container bash..."
        docker-compose exec backend /bin/bash
        ;;
    
    collectstatic)
        print_info "Collecting static files..."
        docker-compose exec backend python manage.py collectstatic --noinput
        print_info "Static files collected!"
        ;;
    
    status)
        print_info "Container status:"
        docker-compose ps
        ;;
    
    clean)
        print_warn "This will remove all containers and volumes!"
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing containers and volumes..."
            docker-compose down -v
            print_info "Cleanup completed!"
        else
            print_warn "Cleanup cancelled."
        fi
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
