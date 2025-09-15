#!/bin/bash

# Stop all local development services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2

    local pid=$(lsof -t -i:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        print_status "Stopping $service_name (PID: $pid) on port $port..."
        kill $pid 2>/dev/null || true
        sleep 2

        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            print_warning "Force killing $service_name..."
            kill -9 $pid 2>/dev/null || true
        fi
    else
        print_status "$service_name is not running on port $port"
    fi
}

main() {
    print_status "Stopping Grocery Price Comparison App - Local Development"

    # Stop Angular frontend (port 4200)
    kill_port 4200 "Angular frontend"

    # Stop .NET API (port 5000 and 5001)
    kill_port 5000 ".NET API (HTTP)"
    kill_port 5001 ".NET API (HTTPS)"

    # Stop Docker services
    print_status "Stopping Docker services..."
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        print_status "Docker services stopped"
    else
        print_status "No Docker services are running"
    fi

    # Optional: Clean up Docker volumes (uncomment if you want to reset database)
    # print_warning "Removing Docker volumes (this will delete database data)..."
    # docker-compose down -v

    print_status "All development services stopped!"
}

# Run main function
main "$@"