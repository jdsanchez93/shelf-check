# Local Development Guide

This guide covers setting up and running the Grocery Price Comparison App locally for development.

## Quick Start

**Start everything with one command:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

**Stop everything:**
```bash
chmod +x dev-stop.sh
./dev-stop.sh
```

## What You Get

The local development environment provides:

- **MySQL Database** (Docker) - localhost:3306
- **Adminer** (Database Admin) - http://localhost:8080
- **.NET Core API** - http://localhost:5000
- **Swagger UI** - http://localhost:5000/swagger
- **Angular Frontend** - http://localhost:4200

## Prerequisites

### Required
- Docker and Docker Compose
- .NET 8 SDK
- Node.js 18+ and npm

### Auto-installed by scripts
- Angular CLI
- Entity Framework Core tools

## Development Workflow

### Full Environment
```bash
# Start all services
./dev-start.sh

# Your app is now running at:
# Frontend: http://localhost:4200
# API: http://localhost:5000
# Database Admin: http://localhost:8080
```

### Individual Services
```bash
# Start only database
./dev-start.sh --db-only

# Start only API (requires database)
./dev-start.sh --api-only

# Start only frontend
./dev-start.sh --frontend-only
```

### Manual Development

If you prefer to run services manually:

#### 1. Database
```bash
docker-compose up -d mysql
```

#### 2. API
```bash
cd api/src/GroceryPriceApi
dotnet restore
dotnet ef database update
dotnet run
```

#### 3. Frontend
```bash
cd frontend
npm install
npm start
```

## Database Access

### Connection Details
- **Host:** localhost
- **Port:** 3306
- **Database:** groceryprices
- **Username:** admin
- **Password:** password123

### Admin Tools
- **Adminer:** http://localhost:8080
- **MySQL CLI:** `docker exec -it grocery-mysql mysql -u admin -p groceryprices`

### Sample Data
The database is automatically populated with sample data including:
- 4 stores (Walmart, Target, Kroger, Safeway)
- 8 products across different categories
- Price data with some deals and promotions

## API Development

### Hot Reload
The .NET API supports hot reload for code changes:
```bash
cd api/src/GroceryPriceApi
dotnet watch run
```

### Database Migrations
```bash
# Create new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Reset database (removes all data)
dotnet ef database drop
dotnet ef database update
```

### API Testing
- **Swagger UI:** http://localhost:5000/swagger
- **Direct endpoints:** http://localhost:5000/api/products

## Frontend Development

### Live Reload
Angular automatically reloads on code changes when running `npm start`.

### Proxy Configuration
The frontend uses a proxy to connect to the API, configured in `proxy.conf.json`:
```json
{
  "/api/*": {
    "target": "http://localhost:5000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Environment Configuration
- **Development:** `src/environments/environment.ts`
- **Production:** `src/environments/environment.prod.ts`

## Debugging

### .NET API
1. Open `api/src/GroceryPriceApi` in Visual Studio or VS Code
2. Set breakpoints
3. Press F5 or use "Debug" launch configuration

### Angular Frontend
1. Open browser DevTools
2. Use Angular DevTools extension
3. Set breakpoints in Sources tab

### Database Queries
1. Use Adminer at http://localhost:8080
2. Or connect with your preferred MySQL client

## Common Issues

### Port Conflicts
If ports are in use:
```bash
# Check what's using a port
lsof -i :3306
lsof -i :4200
lsof -i :5000

# Kill processes
./dev-stop.sh
```

### Docker Issues
```bash
# Reset Docker containers
docker-compose down -v
docker-compose up -d

# View logs
docker-compose logs mysql
```

### Database Connection Issues
```bash
# Restart just the database
docker-compose restart mysql

# Check if MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost -u admin -p
```

### .NET Restore Issues
```bash
cd api/src/GroceryPriceApi
dotnet clean
dotnet restore
dotnet build
```

### Node.js Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## IDE Setup

### Visual Studio Code
Recommended extensions:
- C# Dev Kit
- Angular Language Service
- Docker
- MySQL (by Jun Han)

### Visual Studio
- Open `api/src/GroceryPriceApi/GroceryPriceApi.csproj`
- Set as startup project
- Use IIS Express or self-hosted option

### JetBrains Rider
- Open the solution file
- Configure run configurations for both API and frontend

## Testing Your Scrapers

Once the local environment is running, you can test your scraper scripts by:

1. **Adding stores:**
   ```bash
   curl -X POST http://localhost:5000/api/stores \
     -H "Content-Type: application/json" \
     -d '{"name": "New Store", "location": "Test Location"}'
   ```

2. **Adding products:**
   ```bash
   curl -X POST http://localhost:5000/api/products \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Product", "category": "Test"}'
   ```

3. **Adding prices:**
   ```bash
   curl -X POST http://localhost:5000/api/prices \
     -H "Content-Type: application/json" \
     -d '{"productId": 1, "storeId": 1, "regularPrice": 2.99, "validFrom": "2024-01-01", "validTo": "2024-12-31"}'
   ```

## Performance Tips

- Keep Docker containers running between development sessions
- Use `dotnet watch run` for API development
- Use Angular's `ng serve` for frontend development
- Only restart services when you change configuration

## Cleanup

To completely reset your development environment:
```bash
# Stop all services and remove data
./dev-stop.sh
docker-compose down -v

# This will delete all database data and Docker volumes
```