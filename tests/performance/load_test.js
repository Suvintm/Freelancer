import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
    stages: [
        { duration: '10s', target: 20 }, // Ramp-up to 20 users
        { duration: '30s', target: 20 }, // Stay at 20 users for 30 seconds
        { duration: '10s', target: 0 },  // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
        http_req_failed: ['rate<0.01'],   // Error rate must be < 1%
    },
};

const BASE_URL = 'http://localhost:5051/api';

export default function () {
    // 1. Test public gigs discovery (High traffic endpoint)
    const gigsRes = http.get(`${BASE_URL}/gigs?page=1&limit=12&sort=popular`);
    
    check(gigsRes, {
        'Gigs loaded successfully': (r) => r.status === 200,
        'Response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);

    // 2. Test editors discovery (High traffic endpoint)
    const editorsRes = http.get(`${BASE_URL}/explore/editors?page=1&limit=12&sortBy=relevance`);

    check(editorsRes, {
        'Editors loaded successfully': (r) => r.status === 200,
        'Response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (editorsRes.status !== 200) {
        console.log(`Failed request to /explore/editors. Status: ${editorsRes.status}, Body: ${editorsRes.body}`);
    }

    sleep(1);
}
