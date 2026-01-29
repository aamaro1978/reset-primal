/**
 * k6 Performance Test - Webhook Hotmart
 * Tests webhook latency, throughput, and error rates
 *
 * Run with: k6 run k6-webhook-perf.js
 * Output: k6-results.json
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// Custom metrics
const errorRate = new Rate('errors');
const webhookDuration = new Trend('webhook_duration');
const successfulWebhooks = new Counter('successful_webhooks');
const failedWebhooks = new Counter('failed_webhooks');
const concurrentUsers = new Gauge('concurrent_users');

// Test configuration
export const options = {
  stages: [
    // Ramp up from 1 to 50 concurrent users over 1 minute
    { duration: '1m', target: 50 },
    // Stay at 50 concurrent users for 2 minutes
    { duration: '2m', target: 50 },
    // Ramp down to 0 concurrent users over 1 minute
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'webhook_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'errors': ['rate<0.01'], // Error rate < 1%
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
  ext: {
    loadimpact: {
      projectID: 0, // Set this if using Cloud
      name: 'Reset Primal Webhook Performance Test'
    }
  }
};

// Helper function to create HMAC signature
function createSignature(body, secret) {
  const bodyStr = JSON.stringify(body);
  const hash = crypto.hmac('sha256', secret, bodyStr);
  return encoding.b64encode(hash);
}

// Helper function to generate test purchase event
function generatePurchaseEvent(index) {
  return {
    type: 'PURCHASE_COMPLETE',
    event: 'PURCHASE_COMPLETE',
    data: {
      buyer: {
        name: `Test User ${index}`,
        email: `test${index}@example.com`,
        document: `12345678900${index % 100}`,
        phone: '(11) 98765-4321'
      },
      purchase: {
        id: `HOTMART-TEST-${Date.now()}-${index}`,
        price: 97,
        installments: 1,
        product: {
          id: 'reset-primal-protocol',
          name: 'Reset Primal Protocol'
        },
        status: 'completed',
        date: new Date().toISOString()
      },
      invoice: {
        id: `INV-${Date.now()}-${index}`,
        date: new Date().toISOString(),
        address: {
          street: 'Rua Teste',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brazil'
        }
      }
    }
  };
}

export default function() {
  const baseUrl = 'http://64.225.44.199:3001';
  const webhookSecret = 'test_webhook_secret_for_testing';
  const index = __VU * 1000 + __ITER;

  // Update concurrent users gauge
  concurrentUsers.add(1);

  // Generate test purchase event
  const purchaseEvent = generatePurchaseEvent(index);
  const signature = createSignature(purchaseEvent, webhookSecret);

  group('Webhook - Single Purchase', () => {
    // Test 1: Send webhook with valid signature
    const response = http.post(`${baseUrl}/api/hotmart/webhook`, JSON.stringify(purchaseEvent), {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature
      },
      tags: { name: 'WebhookRequest' },
      timeout: '30s'
    });

    // Track performance
    webhookDuration.add(response.timings.duration);

    // Validate response
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response contains success': (r) => r.body.includes('success'),
      'duration < 500ms': (r) => r.timings.duration < 500,
      'no server errors': (r) => r.status < 500,
    });

    if (success) {
      successfulWebhooks.add(1);
    } else {
      failedWebhooks.add(1);
      errorRate.add(1);
    }
  });

  group('Webhook - Error Scenarios', () => {
    // Test 2: Invalid signature
    const invalidResponse = http.post(`${baseUrl}/api/hotmart/webhook`, JSON.stringify(purchaseEvent), {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': 'invalid_signature'
      },
      tags: { name: 'InvalidSignature' }
    });

    check(invalidResponse, {
      'invalid signature returns 401': (r) => r.status === 401,
      'response time reasonable': (r) => r.timings.duration < 100
    });

    // Test 3: Missing signature
    const noSigResponse = http.post(`${baseUrl}/api/hotmart/webhook`, JSON.stringify(purchaseEvent), {
      headers: {
        'Content-Type': 'application/json'
        // No signature
      },
      tags: { name: 'NoSignature' }
    });

    check(noSigResponse, {
      'missing signature returns 401': (r) => r.status === 401
    });

    // Test 4: Malformed JSON
    const malformedResponse = http.post(`${baseUrl}/api/hotmart/webhook`, 'invalid json {', {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature
      },
      tags: { name: 'MalformedJSON' }
    });

    check(malformedResponse, {
      'malformed JSON returns error': (r) => r.status >= 400
    });
  });

  group('Webhook - Health Check', () => {
    // Test 5: Health check endpoint
    const healthResponse = http.get(`${baseUrl}/api/hotmart/test`, {
      tags: { name: 'HealthCheck' }
    });

    check(healthResponse, {
      'health check returns 200': (r) => r.status === 200,
      'contains GA4 status': (r) => r.body.includes('ga4_configured'),
      'response time < 100ms': (r) => r.timings.duration < 100
    });
  });

  group('Concurrent Purchases', () => {
    // Test 6: Rapid sequential purchases
    const event1 = generatePurchaseEvent(index);
    const sig1 = createSignature(event1, webhookSecret);

    const resp1 = http.post(`${baseUrl}/api/hotmart/webhook`, JSON.stringify(event1), {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': sig1
      }
    });

    check(resp1, {
      'first purchase succeeds': (r) => r.status === 200
    });

    // Immediate second purchase (same user, different txn)
    const event2 = {
      ...event1,
      data: {
        ...event1.data,
        purchase: {
          ...event1.data.purchase,
          id: `HOTMART-TEST-${Date.now()}-${index + 1}`
        }
      }
    };
    const sig2 = createSignature(event2, webhookSecret);

    const resp2 = http.post(`${baseUrl}/api/hotmart/webhook`, JSON.stringify(event2), {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': sig2
      }
    });

    check(resp2, {
      'second purchase succeeds': (r) => r.status === 200,
      'handles duplicate user': (r) => r.status === 200
    });
  });

  // Think time between requests
  sleep(1);

  concurrentUsers.add(-1);
}

// Setup phase
export function setup() {
  console.log('Starting Webhook Performance Test...');
  console.log(`Target: 64.225.44.199:3001/api/hotmart/webhook`);
  console.log(`Total VUs: Ramping from 1 to 50`);
  console.log(`Duration: 4 minutes`);
}

// Teardown phase
export function teardown(data) {
  console.log('Test completed');
}
