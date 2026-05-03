# Triage
An Event-Driven order processing Pipeline with AI Fraud Detection.

## Architecture
Architecture diagram coming soon.

## Current State
Implemented full async order processing pipeline with Step Functions orchestration. `POST /orders` via API Gateway triggers a Lambda that validates, writes to DynamoDB, publishes to SQS, and returns 201 immediately. A worker Lambda processes orders idempotently (conditional `UpdateCommand` prevents duplicate processing) and starts a Step Functions state machine. The state machine runs four steps in sequence — `AIFraudScore → CheckInventory → ProcessPayment → FulfillOrder` — each updating the order status in DynamoDB. A dead-letter queue catches messages that fail after 3 attempts. Four stacks (`PersistenceStack`, `MessagingStack`, `ApiStack`, `WorkflowStack`) deployed to AWS and verified end-to-end with order reaching `COMPLETED` status. Jest unit tests cover ingestion validation and worker idempotency logic.

## Tech Stack
- **Languages:** TypeScript (CDK + Lambda handlers)
- **AWS:** Lambda, API Gateway, SQS, Step Functions, DynamoDB, EventBridge, SES, Bedrock, CloudWatch, X-Ray
- **IaC:** AWS CDK v2
- **Dev tools:** LocalStack, Docker, GitHub Actions, Jest

## Getting Started
Setup and deployment instructions coming soon.
