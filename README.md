# Triage
An Event-Driven order processing Pipeline with AI Fraud Detection.

## Architecture
Architecture diagram coming soon.

## Current State
Implemented full async order processing pipeline with resilience. `POST /orders` via API Gateway triggers a Lambda handler that validates the request, writes the order to DynamoDB, publishes an `OrderCreated` message to SQS, and returns a 201 immediately. A worker Lambda triggered by SQS processes orders idempotently — using a conditional DynamoDB `UpdateCommand` to transition status from `PENDING` to `PROCESSING`, preventing duplicate processing on SQS retries. A dead-letter queue catches messages that fail after 3 attempts. Three stacks (`PersistenceStack`, `MessagingStack`, `ApiStack`) deployed to AWS and verified end-to-end including DLQ behaviour. Jest unit tests cover input validation and order creation scenarios.

## Tech Stack
- **Languages:** TypeScript (CDK + Lambda handlers)
- **AWS:** Lambda, API Gateway, SQS, Step Functions, DynamoDB, EventBridge, SES, Bedrock, CloudWatch, X-Ray
- **IaC:** AWS CDK v2
- **Dev tools:** LocalStack, Docker, GitHub Actions, Jest

## Getting Started
Setup and deployment instructions coming soon.
