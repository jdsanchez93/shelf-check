#!/bin/bash

# Local development startup script for Grocery Price Comparison App

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service to be ready on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_status "$service is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "$service is not responding after $max_attempts attempts"
    return 1
}

# Start Docker services
start_docker_services() {
    print_section "Starting Docker services..."

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_warning "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Start MySQL and Adminer
    print_status "Starting MySQL database..."
    docker-compose up -d mysql

    # Wait for MySQL to be ready
    wait_for_service "MySQL" 3306

    # Start Adminer (optional)
    print_status "Starting Adminer (database admin tool)..."
    docker-compose up -d adminer

    print_status "Database services are running!"
    print_status "MySQL: localhost:3306 (admin/password123)"
    print_status "Adminer: http://localhost:8080"
}

# Start .NET API
start_api() {
    print_section "Starting .NET API..."

    cd api/src/GroceryPriceApi

    # Check if EF Core tools are installed
    if ! dotnet ef --version > /dev/null 2>&1; then
        print_status "Installing Entity Framework Core tools..."
        dotnet tool install --global dotnet-ef
    fi

    # Restore packages
    print_status "Restoring NuGet packages..."
    dotnet restore

    # Run migrations
    print_status "Running database migrations..."
    dotnet ef database update

    # Start the API in the background
    print_status "Starting .NET API on http://localhost:5000..."
    dotnet run --project . &
    API_PID=$!

    cd ../../..

    # Wait for API to be ready
    wait_for_service ".NET API" 5000

    print_status ".NET API is running!"
    print_status "API: http://localhost:5000"
    print_status "Swagger: http://localhost:5000/swagger"
}

# Start Angular frontend
start_frontend() {
    print_section "Starting Angular frontend..."

    cd frontend

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Check if Angular CLI is installed
    if ! command -v ng &> /dev/null; then
        print_status "Installing Angular CLI..."
        npm install -g @angular/cli
    fi

    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi

    # Start Angular development server
    print_status "Starting Angular development server on http://localhost:4200..."
    npm start &
    FRONTEND_PID=$!

    cd ..

    # Wait for frontend to be ready
    wait_for_service "Angular frontend" 4200

    print_status "Angular frontend is running!"
    print_status "Frontend: http://localhost:4200"
}

# Cleanup function
cleanup() {
    print_section "Shutting down development environment..."

    # Kill Angular process
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping Angular frontend..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Kill .NET API process
    if [ ! -z "$API_PID" ]; then
        print_status "Stopping .NET API..."
        kill $API_PID 2>/dev/null || true
    fi

    # Stop Docker services
    print_status "Stopping Docker services..."
    docker-compose down

    print_status "Development environment stopped."
}

# Set up signal handlers
trap cleanup EXIT
trap cleanup SIGINT
trap cleanup SIGTERM

# Main execution
main() {
    print_section "Starting Grocery Price Comparison App - Local Development"

    # Parse arguments
    START_DB_ONLY=false
    START_API_ONLY=false
    START_FRONTEND_ONLY=false

    for arg in "$@"; do
        case $arg in
            --db-only)
                START_DB_ONLY=true
                ;;
            --api-only)
                START_API_ONLY=true
                ;;
            --frontend-only)
                START_FRONTEND_ONLY=true
                ;;
            --help)
                echo "Usage: ./dev-start.sh [options]"
                echo "Options:"
                echo "  --db-only         Start only database services"
                echo "  --api-only        Start only .NET API (requires database)"
                echo "  --frontend-only   Start only Angular frontend"
                echo "  --help           Show this help message"
                exit 0
                ;;
        esac
    done

    # Start services based on arguments
    if [ "$START_DB_ONLY" = true ]; then
        start_docker_services
    elif [ "$START_API_ONLY" = true ]; then
        start_api
    elif [ "$START_FRONTEND_ONLY" = true ]; then
        start_frontend
    else
        # Start all services
        start_docker_services
        start_api
        start_frontend
    fi

    # Print summary
    echo ""
    echo "========================================"
    echo -e "${GREEN}Development environment is ready!${NC}"
    echo "========================================"
    echo ""
    echo "Services running:"
    echo "• MySQL Database: localhost:3306"
    echo "• Adminer (DB Admin): http://localhost:8080"
    echo "• .NET API: http://localhost:5000"
    echo "• Swagger UI: http://localhost:5000/swagger"
    echo "• Angular Frontend: http://localhost:4200"
    echo ""
    echo "Database credentials:"
    echo "• Host: localhost"
    echo "• Port: 3306"
    echo "• Database: groceryprices"
    echo "• Username: admin"
    echo "• Password: password123"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for user to stop
    wait
}

# Run main function
main "$@"