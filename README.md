# Triage
An Event-Driven order processing Pipeline with AI Fraud Detection.

## Architecture
Architecture diagram coming soon.

## Current State
Implemented full async order processing pipeline with Step Functions orchestration and AI-powered fraud detection. `POST /orders` via API Gateway triggers a Lambda that validates, writes to DynamoDB, publishes to SQS, and returns 201 immediately. A worker Lambda processes orders idempotently (conditional `UpdateCommand` prevents duplicate processing) and starts a Step Functions state machine.

The state machine runs: `AIFraudScore → Choice → CheckInventory → ProcessPayment → FulfillOrder → PublishOrderCompleted` for clean orders, and `ManualReviewQueue → PublishOrderFlagged` for flagged orders. The `AIFraudScore` Lambda calls Amazon Bedrock (Anthropic API) with order context and returns a risk score (0–1) and reasoning, both written to DynamoDB. Orders scoring above 0.7 are routed to a `ManualReviewQueue` (SQS); clean orders continue through the workflow to `COMPLETED`. Each step has retry policies (2 attempts, exponential backoff) and routes to a `Fail` state on exhaustion. A dead-letter queue catches messages that fail after 3 SQS delivery attempts. Bedrock cost per call is tracked as a custom CloudWatch metric under the `Triage/Bedrock` namespace.

On workflow completion, Step Functions publishes domain events (`OrderCompleted`, `OrderFlagged`) to a custom EventBridge bus. An EventBridge rule routes `OrderCompleted` to a Lambda that sends a confirmation email via SES. Five stacks (`PersistenceStack`, `MessagingStack`, `ApiStack`, `WorkflowStack`, `EventBridgeStack`) deployed to AWS and verified end-to-end. Jest unit tests cover ingestion validation, worker idempotency, and fraud scoring logic.

## Tech Stack
- **Languages:** TypeScript (CDK + Lambda handlers)
- **AWS:** Lambda, API Gateway, SQS, Step Functions, DynamoDB, EventBridge, SES, Bedrock, CloudWatch, X-Ray
- **IaC:** AWS CDK v2
- **Dev tools:** LocalStack, Docker, GitHub Actions, Jest

## Getting Started
Setup and deployment instructions coming soon.
