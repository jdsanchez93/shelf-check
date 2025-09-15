#!/bin/bash

# Main deployment script for Grocery Price Comparison App

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    # Check .NET SDK
    if ! command -v dotnet &> /dev/null; then
        print_error ".NET SDK is not installed"
        exit 1
    fi

    # Check AWS CDK
    if ! command -v cdk &> /dev/null; then
        print_warning "AWS CDK is not installed. Installing globally..."
        npm install -g aws-cdk
    fi

    # Check Angular CLI
    if ! command -v ng &> /dev/null; then
        print_warning "Angular CLI is not installed. Installing globally..."
        npm install -g @angular/cli
    fi

    print_status "All prerequisites met!"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure with AWS CDK..."

    cd infrastructure

    # Install dependencies
    print_status "Installing CDK dependencies..."
    npm install

    # Bootstrap CDK (only needs to be done once per account/region)
    print_status "Bootstrapping CDK..."
    cdk bootstrap || true

    # Deploy the stack
    print_status "Deploying CDK stack..."
    cdk deploy --require-approval never --outputs-file cdk-outputs.json

    # Extract outputs
    API_ENDPOINT=$(cat cdk-outputs.json | grep -o '"ApiEndpoint": "[^"]*' | grep -o '[^"]*$')
    BUCKET_NAME=$(cat cdk-outputs.json | grep -o '"FrontendBucketName": "[^"]*' | grep -o '[^"]*$')
    DISTRIBUTION_ID=$(cat cdk-outputs.json | grep -o '"DistributionId": "[^"]*' | grep -o '[^"]*$' || echo "")

    # Save to parent directory
    echo "API_ENDPOINT=$API_ENDPOINT" > ../deployment-config.env
    echo "BUCKET_NAME=$BUCKET_NAME" >> ../deployment-config.env
    echo "DISTRIBUTION_ID=$DISTRIBUTION_ID" >> ../deployment-config.env

    cd ..

    print_status "Infrastructure deployed successfully!"
}

# Build and deploy Lambda function
deploy_lambda() {
    print_status "Building and deploying Lambda function..."

    cd api/src/GroceryPriceApi

    # Restore dependencies
    print_status "Restoring .NET dependencies..."
    dotnet restore

    # Build the project
    print_status "Building Lambda function..."
    dotnet publish -c Release -r linux-x64 --self-contained false

    # Create deployment package
    print_status "Creating deployment package..."
    cd bin/Release/net8.0/linux-x64/publish
    zip -r ../../../../../lambda-deployment.zip . -x "*.pdb"

    cd ../../../../../..

    # Update Lambda function
    print_status "Updating Lambda function code..."
    source deployment-config.env

    FUNCTION_NAME="GroceryPriceInfrastructureStack-ApiFunction"

    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://api/src/GroceryPriceApi/lambda-deployment.zip

    print_status "Lambda function deployed successfully!"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."

    cd frontend

    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install

    # Update environment with API endpoint
    source ../deployment-config.env

    cat > src/environments/environment.prod.ts <<EOF
export const environment = {
  production: true,
  apiUrl: '${API_ENDPOINT}'
};
EOF

    # Build the Angular app
    print_status "Building Angular application..."
    npm run build:prod

    # Deploy to S3
    print_status "Deploying to S3..."
    aws s3 sync dist/grocery-price-frontend/browser s3://$BUCKET_NAME --delete

    # Invalidate CloudFront cache
    if [ ! -z "$DISTRIBUTION_ID" ]; then
        print_status "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/*"
    fi

    cd ..

    print_status "Frontend deployed successfully!"
}

# Run database migrations
run_migrations() {
    print_status "Preparing database migrations..."

    cd api/src/GroceryPriceApi

    # Install EF Core tools if not present
    if ! dotnet ef &> /dev/null; then
        print_status "Installing Entity Framework Core tools..."
        dotnet tool install --global dotnet-ef
    fi

    # Create initial migration
    print_status "Creating database migration..."
    dotnet ef migrations add InitialCreate || true

    # Note: Migrations will run automatically when Lambda starts in dev mode
    # For production, you might want to run them separately

    cd ../../..

    print_status "Database migrations prepared!"
}

# Main deployment flow
main() {
    print_status "Starting deployment of Grocery Price Comparison App..."

    check_prerequisites

    # Parse arguments
    SKIP_INFRA=false
    SKIP_LAMBDA=false
    SKIP_FRONTEND=false

    for arg in "$@"; do
        case $arg in
            --skip-infra)
                SKIP_INFRA=true
                ;;
            --skip-lambda)
                SKIP_LAMBDA=true
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                ;;
            --help)
                echo "Usage: ./deploy.sh [options]"
                echo "Options:"
                echo "  --skip-infra     Skip infrastructure deployment"
                echo "  --skip-lambda    Skip Lambda deployment"
                echo "  --skip-frontend  Skip frontend deployment"
                echo "  --help          Show this help message"
                exit 0
                ;;
        esac
    done

    if [ "$SKIP_INFRA" = false ]; then
        deploy_infrastructure
    else
        print_warning "Skipping infrastructure deployment"
    fi

    if [ "$SKIP_LAMBDA" = false ]; then
        deploy_lambda
        run_migrations
    else
        print_warning "Skipping Lambda deployment"
    fi

    if [ "$SKIP_FRONTEND" = false ]; then
        deploy_frontend
    else
        print_warning "Skipping frontend deployment"
    fi

    # Print summary
    source deployment-config.env

    echo ""
    echo "========================================"
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo "========================================"
    echo ""
    echo "Your application is available at:"
    echo "Frontend: Check CloudFront URL in AWS Console"
    echo "API: $API_ENDPOINT"
    echo ""
    echo "Next steps:"
    echo "1. Run your scraper scripts to populate the database"
    echo "2. Visit the frontend URL to start comparing prices"
    echo ""
}

# Run main function
main "$@"