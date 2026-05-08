# Load Test Results

## Bottlenecks Found and Fixed

### 1. DynamoDB Provisioned Capacity
Default 5 WCU/s caused write throttling under concurrent load. Fixed by switching to `PAY_PER_REQUEST` billing mode.

### 2. Lambda Account Concurrency Limit
Account was capped at 10 concurrent executions (set as a cost protection measure during setup). At 10 VUs the account was already maxed out, throttling all downstream Lambdas (worker, aiFraudScore, etc.) as well. Fixed by filing a Service Quotas increase to 1,000.

## Results

| Test | VUs | Requests | Throughput | p95 | p99 | Error Rate |
|------|-----|----------|------------|-----|-----|------------|
| Smoke (pre-fix) | 10 | 640 | 8 req/s | — | — | 48% |
| Smoke (post-fix) | 10 | 643 | 8 req/s | 133ms | 275ms | 0% |
| Full load | 100 | 30,334 | 84 req/s | 130ms | 212ms | 0% |

## Notes

- p99 at full load (212ms) was lower than smoke test p99 (275ms) — Lambda instances warmed up under sustained load.
- Bedrock (aiFraudScore) runs async inside Step Functions and does not contribute to the `POST /orders` latency numbers above.
