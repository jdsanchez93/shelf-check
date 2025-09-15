#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GroceryPriceInfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new GroceryPriceInfrastructureStack(app, 'GroceryPriceInfrastructureStack', {
  env,
  description: 'Grocery Price Comparison App - Serverless Infrastructure',
});