import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GroceryPriceInfrastructureStackProps extends cdk.StackProps {
  dbUsername?: string;
  dbPassword?: string;
  environment?: string;
}

export class GroceryPriceInfrastructureStack extends cdk.Stack {
  public readonly apiEndpoint: string;
  public readonly distributionUrl: string;
  public readonly bucketName: string;
  public readonly dbEndpoint: string;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: GroceryPriceInfrastructureStackProps) {
    super(scope, id, props);

    const dbUsername = props?.dbUsername || 'admin';
    const environment = props?.environment || 'dev';

    // VPC Configuration - Private subnets only for RDS and Lambda
    const vpc = new ec2.Vpc(this, 'GroceryVPC', {
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway to save costs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS MySQL instance',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL connection from Lambda'
    );

    // Create database credentials secret
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      description: 'RDS MySQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: dbUsername }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });
    this.dbSecret = dbSecret;

    // RDS MySQL Instance (Free Tier eligible)
    const dbInstance = new rds.DatabaseInstance(this, 'MySQLInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'groceryprices',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environment
      deletionProtection: false, // For dev environment
    });

    this.dbEndpoint = dbInstance.dbInstanceEndpointAddress;

    // Store complete connection info in the secret
    const dbConnectionSecret = new secretsmanager.Secret(this, 'DBConnectionSecret', {
      description: 'Complete database connection information',
      secretObjectValue: {
        host: cdk.SecretValue.unsafePlainText(dbInstance.dbInstanceEndpointAddress),
        port: cdk.SecretValue.unsafePlainText(dbInstance.dbInstanceEndpointPort),
        database: cdk.SecretValue.unsafePlainText('groceryprices'),
        username: dbSecret.secretValueFromJson('username'),
        password: dbSecret.secretValueFromJson('password'),
      },
    });

    // Lambda Function for API (.NET 8)
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'GroceryPriceApi::GroceryPriceApi.LambdaEntryPoint::FunctionHandlerAsync',
      code: lambda.Code.fromAsset('../api/src/GroceryPriceApi/bin/Release/net8.0/publish.zip', {
        exclude: ['*.pdb'],
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_CONNECTION_SECRET: dbConnectionSecret.secretArn,
        ASPNETCORE_ENVIRONMENT: environment,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Grant Lambda permission to read the secret
    dbConnectionSecret.grantRead(apiFunction);

    // API Gateway HTTP API
    const httpApi = new apigateway.HttpApi(this, 'GroceryPriceApi', {
      description: 'Grocery Price Comparison API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiFunction
    );

    // Add default route
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    this.apiEndpoint = httpApi.url!;

    // S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environment
      autoDeleteObjects: true, // For dev environment
    });

    this.bucketName = frontendBucket.bucketName;

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    this.distributionUrl = `https://${distribution.distributionDomainName}`;

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: this.distributionUrl,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.bucketName,
      description: 'S3 bucket name for frontend deployment',
    });

    new cdk.CfnOutput(this, 'DBEndpoint', {
      value: this.dbEndpoint,
      description: 'RDS MySQL endpoint',
    });

    new cdk.CfnOutput(this, 'DBSecretArn', {
      value: dbConnectionSecret.secretArn,
      description: 'Database connection secret ARN',
    });
  }
}