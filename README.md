# Triage
An Event-Driven order processing Pipeline with AI Fraud Detection.

## Architecture
Architecture diagram coming soon.

## Current State
Implemented full async order processing pipeline with Step Functions orchestration and AI-powered fraud detection. `POST /orders` via API Gateway triggers a Lambda that validates, writes to DynamoDB, publishes to SQS, and returns 201 immediately. A worker Lambda processes orders idempotently (conditional `UpdateCommand` prevents duplicate processing) and starts a Step Functions state machine.

The state machine runs: `AIFraudScore → Choice → CheckInventory → ProcessPayment → FulfillOrder → PublishOrderCompleted` for clean orders, and `ManualReviewQueue → PublishOrderFlagged` for flagged orders. The `AIFraudScore` Lambda calls Amazon Bedrock (Anthropic API) with order context and returns a risk score (0–1) and reasoning, both written to DynamoDB. Orders scoring above 0.7 are routed to a `ManualReviewQueue` (SQS); clean orders continue through the workflow to `COMPLETED`. Each step has retry policies (2 attempts, exponential backoff) and routes to a `Fail` state on exhaustion. A dead-letter queue catches messages that fail after 3 SQS delivery attempts. Bedrock cost per call is tracked as a custom CloudWatch metric under the `Triage/Bedrock` namespace.

On workflow completion, Step Functions publishes domain events (`OrderCompleted`, `OrderFlagged`) to a custom EventBridge bus. An EventBridge rule routes `OrderCompleted` to a Lambda that sends a confirmation email via SES. X-Ray active tracing is enabled on all Lambdas and the Step Functions state machine, providing end-to-end distributed traces through the fraud scoring step. A CloudWatch dashboard (`Triage-Orders`) exposes request rate, p50/p95/p99 Lambda latency, error rate, DLQ depth, and Bedrock cost per call. Six stacks (`PersistenceStack`, `MessagingStack`, `ApiStack`, `WorkflowStack`, `EventBridgeStack`, `ObservabilityStack`) deployed to AWS and verified end-to-end. Jest unit tests cover ingestion validation, worker idempotency, and fraud scoring logic.

Load testing is in progress using k6 (ramp to 100 req/s over 30s, hold for 5 minutes). Initial smoke testing revealed two bottlenecks:

- **DynamoDB provisioned capacity** — the default 5 WCU/s caused ~45% request failures under concurrent load. Fixed by switching to `PAY_PER_REQUEST` billing mode.
- **Lambda account concurrency limit** — account was capped at 10 concurrent executions (set as a cost protection measure during setup), causing Lambda throttling under load. Quota increase to 1,000 pending AWS Support approval; full load test results to follow.

Lambda memory sizes tuned using AWS Lambda Power Tuning (10 invocations per memory configuration across 128/256/512/1024MB):

| Lambda | Before | After | Speedup |
|--------|--------|-------|---------|
| createOrder | 128MB | 256MB | 5x faster |
| worker | 128MB | 512MB | 55x faster |
| checkInventory | 128MB | 1024MB | 112x faster |
| processPayment | 128MB | 512MB | 32x faster |
| fulfillOrder | 128MB | 512MB | 5x faster |

## Tech Stack
- **Languages:** TypeScript (CDK + Lambda handlers)
- **AWS:** Lambda, API Gateway, SQS, Step Functions, DynamoDB, EventBridge, SES, Bedrock, CloudWatch, X-Ray
- **IaC:** AWS CDK v2
- **Dev tools:** LocalStack, Docker, GitHub Actions, Jest

## Getting Started
Setup and deployment instructions coming soon.
