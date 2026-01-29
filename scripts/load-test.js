/**
 * Load Testing Script - Reset Primal
 *
 * k6-compatible load testing scenarios
 * Usage: k6 run scripts/load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Gauge } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const apiErrors = new Rate('api_errors');
const throughput = new Gauge('throughput');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-key';

export const options = {
  // Scenarios for different load profiles
  scenarios: {
    // Scenario 1: Normal load
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 users
        { duration: '3m', target: 10 },   // Stay at 10 users
        { duration: '1m', target: 0 }     // Ramp down
      ],
      gracefulStop: '30s'
    }
  },

  // Thresholds (acceptance criteria)
  thresholds: {
    'http_req_duration': ['p(95)<100', 'p(99)<500'],
    'http_req_failed': ['rate<0.01'],
    'api_errors': ['rate<0.01']
  },

  // Reporting
  ext: {
    loadimpact: {
      projectID: 3123621,
      name: 'reset-primal-load-test'
    }
  }
};

/**
 * Scenario 1: Test API endpoints
 */
function testAPIEndpoints() {
  const start = Date.now();

  group('API Endpoints', () => {
    // GET /health/status
    {
      const res = http.get(`${BASE_URL}/health/status`);
      check(res, {
        'health check succeeds': (r) => r.status === 200,
        'health check time < 100ms': (r) => r.timings.duration < 100
      });
      apiDuration.add(res.timings.duration);
      apiErrors.add(res.status >= 400 ? 1 : 0);
    }

    sleep(1);

    // GET /api/users
    {
      const res = http.get(`${BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      check(res, {
        'users list succeeds': (r) => r.status === 200,
        'users list time < 150ms': (r) => r.timings.duration < 150
      });
      apiDuration.add(res.timings.duration);
      apiErrors.add(res.status >= 400 ? 1 : 0);
    }

    sleep(1);

    // GET /api/products
    {
      const res = http.get(`${BASE_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      check(res, {
        'products list succeeds': (r) => r.status === 200,
        'products list time < 200ms': (r) => r.timings.duration < 200
      });
      apiDuration.add(res.timings.duration);
      apiErrors.add(res.status >= 400 ? 1 : 0);
    }

    sleep(1);

    // GET /api/purchases
    {
      const res = http.get(`${BASE_URL}/api/purchases`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      check(res, {
        'purchases list succeeds': (r) => r.status === 200,
        'purchases list time < 250ms': (r) => r.timings.duration < 250
      });
      apiDuration.add(res.timings.duration);
      apiErrors.add(res.status >= 400 ? 1 : 0);
    }

    sleep(1);
  });

  const elapsed = Date.now() - start;
  throughput.add(elapsed);
}

/**
 * Scenario 2: Test user operations
 */
function testUserOperations() {
  group('User Operations', () => {
    // Create user
    const createRes = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify({
        email: `user-${Date.now()}@example.com`,
        name: 'Test User'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    check(createRes, {
      'create user succeeds': (r) => r.status === 201
    });
    apiDuration.add(createRes.timings.duration);
    apiErrors.add(createRes.status >= 400 ? 1 : 0);

    let userId = null;
    try {
      userId = JSON.parse(createRes.body).id;
    } catch (e) {
      console.error('Failed to parse user creation response');
    }

    if (userId) {
      sleep(1);

      // Get user
      const getRes = http.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      check(getRes, {
        'get user succeeds': (r) => r.status === 200
      });
      apiDuration.add(getRes.timings.duration);
      apiErrors.add(getRes.status >= 400 ? 1 : 0);

      sleep(1);

      // Update user
      const updateRes = http.put(
        `${BASE_URL}/api/users/${userId}`,
        JSON.stringify({
          name: 'Updated User'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      check(updateRes, {
        'update user succeeds': (r) => r.status === 200
      });
      apiDuration.add(updateRes.timings.duration);
      apiErrors.add(updateRes.status >= 400 ? 1 : 0);
    }
  });
}

/**
 * Scenario 3: Test purchase flow
 */
function testPurchaseFlow() {
  group('Purchase Flow', () => {
    // Get products
    const productsRes = http.get(`${BASE_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    let productId = null;
    try {
      const products = JSON.parse(productsRes.body);
      if (products && products.length > 0) {
        productId = products[0].id;
      }
    } catch (e) {
      console.error('Failed to parse products response');
    }

    if (productId) {
      sleep(1);

      // Create purchase
      const purchaseRes = http.post(
        `${BASE_URL}/api/purchases`,
        JSON.stringify({
          productId,
          quantity: 1,
          amount: 99.99
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      check(purchaseRes, {
        'create purchase succeeds': (r) => r.status === 201,
        'purchase time < 300ms': (r) => r.timings.duration < 300
      });
      apiDuration.add(purchaseRes.timings.duration);
      apiErrors.add(purchaseRes.status >= 400 ? 1 : 0);

      let purchaseId = null;
      try {
        purchaseId = JSON.parse(purchaseRes.body).id;
      } catch (e) {
        console.error('Failed to parse purchase creation response');
      }

      if (purchaseId) {
        sleep(1);

        // Get purchase
        const getPurchaseRes = http.get(
          `${BASE_URL}/api/purchases/${purchaseId}`,
          {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
          }
        );

        check(getPurchaseRes, {
          'get purchase succeeds': (r) => r.status === 200
        });
        apiDuration.add(getPurchaseRes.timings.duration);
        apiErrors.add(getPurchaseRes.status >= 400 ? 1 : 0);
      }
    }
  });
}

/**
 * Main test function
 */
export default function() {
  // Distribute load across different test scenarios
  const scenario = __VU % 3;

  switch (scenario) {
    case 0:
      testAPIEndpoints();
      break;
    case 1:
      testUserOperations();
      break;
    case 2:
      testPurchaseFlow();
      break;
  }

  sleep(Math.random() * 3);
}

/**
 * Teardown - Print summary
 */
export function teardown(data) {
  console.log('Load test completed');
}
