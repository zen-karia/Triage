# Triage
An Event-Driven order processing Pipeline with AI Fraud Detection.

## Architecture
Architecture diagram coming soon.

## Current State
Implemented async order processing pipeline. `POST /orders` via API Gateway triggers a Lambda handler that validates the request, writes the order to DynamoDB, publishes an `OrderCreated` message to SQS, and returns a 201 with the generated `orderId`. A separate worker Lambda is triggered by SQS and logs the order for downstream processing. Three stacks (`PersistenceStack`, `MessagingStack`, `ApiStack`) deployed to AWS and verified end-to-end. Jest unit tests cover input validation and order creation scenarios.

## Tech Stack
- **Languages:** TypeScript (CDK + Lambda handlers)
- **AWS:** Lambda, API Gateway, SQS, Step Functions, DynamoDB, EventBridge, SES, Bedrock, CloudWatch, X-Ray
- **IaC:** AWS CDK v2
- **Dev tools:** LocalStack, Docker, GitHub Actions, Jest

## Getting Started
Setup and deployment instructions coming soon.
