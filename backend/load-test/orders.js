import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 100 },   // ramp to 100
        { duration: '5m',  target: 100 },  // hold
        { duration: '30s', target: 0 }     // ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(99)<3000'],
        'http_req_failed':   ['rate<0.05'],
    }
}

export default function () {
  const payload = JSON.stringify({
    customerId: `customer-${__VU}`,
    totalAmount: Math.random() * 500 + 10, 
    items: [{ productId: `prod-${Math.floor(Math.random() * 20)}`, quantity: Math.floor(Math.random() * 5) + 1, price: Math.random() * 100 + 5 }]

  });

  const res = http.post("https://o6ssc2b8zj.execute-api.us-east-1.amazonaws.com/prod/orders", payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, {
    'status is 201': (r) => r.status === 201
  });

  if (res.status !== 201) {
    console.log(`FAILED: ${res.status} - ${res.body}`);
  }

  sleep(1);
}