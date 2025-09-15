# Grocery Price Comparison App

A serverless web application for comparing grocery prices across local stores, built with AWS CDK, .NET Core, and Angular.

## Architecture

- **Infrastructure**: AWS CDK (TypeScript)
- **Backend**: .NET 8 Lambda with Entity Framework Core
- **Frontend**: Angular 19
- **Database**: RDS MySQL (Free Tier)
- **Hosting**: S3 + CloudFront
- **API**: API Gateway HTTP API

## Project Structure

```
grocery-ad-scrape/
├── infrastructure/     # AWS CDK infrastructure code
├── api/               # .NET Core Lambda API
│   └── src/
│       └── GroceryPriceApi/
├── frontend/          # Angular 19 application
└── deploy.sh         # Main deployment script
```

## Prerequisites

- AWS CLI configured with credentials
- Node.js 18+ and npm
- .NET 8 SDK
- Angular CLI (`npm install -g @angular/cli`)
- AWS CDK (`npm install -g aws-cdk`)

## Deployment

### Full Deployment

Deploy the entire application:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Partial Deployment

Deploy specific components:

```bash
# Deploy only infrastructure
./deploy.sh --skip-lambda --skip-frontend

# Deploy only Lambda function
./deploy.sh --skip-infra --skip-frontend

# Deploy only frontend
./deploy.sh --skip-infra --skip-lambda
```

## Local Development

### Quick Start
```bash
# Start everything (database, API, frontend)
chmod +x dev-start.sh
./dev-start.sh

# Stop everything
./dev-stop.sh
```

This gives you:
- MySQL database with sample data
- .NET API with hot reload
- Angular frontend with proxy
- Database admin tools

**See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed local development guide.**

### Manual Setup

#### Database
```bash
docker-compose up -d mysql
```

#### Backend API
```bash
cd api/src/GroceryPriceApi
dotnet restore
dotnet ef database update
dotnet run
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Infrastructure
```bash
cd infrastructure
npm install
cdk synth  # Synthesize CloudFormation template
cdk diff   # Show what will change
cdk deploy # Deploy to AWS
```

## API Endpoints

- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

- `GET /api/stores` - List all stores
- `GET /api/stores/{id}` - Get store details
- `POST /api/stores` - Create new store
- `PUT /api/stores/{id}` - Update store
- `DELETE /api/stores/{id}` - Delete store

- `GET /api/prices/compare` - Compare prices for a product
- `GET /api/prices/history` - Get price history
- `GET /api/prices/deals` - Get current deals
- `POST /api/prices` - Add new price

## Database Schema

### Products Table
- id (PK)
- name
- brand
- category
- unit
- size
- barcode
- created_at
- updated_at

### Stores Table
- id (PK)
- name
- location
- address
- created_at
- updated_at

### Prices Table
- id (PK)
- product_id (FK)
- store_id (FK)
- regular_price
- sale_price
- promotion_type
- promotion_details
- valid_from
- valid_to
- scraped_at
- created_at

## Cost Optimization

This architecture is optimized for AWS Free Tier:

- **RDS**: db.t3.micro instance (750 hours/month free for 12 months)
- **Lambda**: 1M requests/month free (always free)
- **API Gateway**: 1M requests/month free for 12 months
- **S3**: 5GB storage free for 12 months
- **CloudFront**: 1TB data transfer free for 12 months
- **No NAT Gateway**: Lambda in private subnet without internet access saves ~$45/month

## Security

- RDS in private subnet with no public access
- Lambda functions access RDS via VPC
- Database credentials stored in AWS Secrets Manager
- API Gateway handles authentication (can add Cognito)
- CloudFront provides DDoS protection

## Monitoring

- CloudWatch Logs for Lambda functions
- RDS Performance Insights (if enabled)
- CloudFront metrics
- API Gateway metrics

## Clean Up

To avoid charges, destroy all resources when done:

```bash
cd infrastructure
cdk destroy
```

## Next Steps

1. Add your grocery store scraper scripts to populate the database
2. Implement authentication with AWS Cognito
3. Add price alerts and notifications
4. Implement data visualization for price trends
5. Add mobile responsiveness optimizations