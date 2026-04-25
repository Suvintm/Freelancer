import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m',  target: 20 }, // stay at 20 users
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    // http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    // http_req_failed: ['rate<0.01'],   // less than 1% failure rate
  },
};

export default function () {
  const url = __ENV.BASE_URL || 'http://localhost:5000';
  const res = http.get(`${url}/api/status`); // Assuming there's a status endpoint
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
