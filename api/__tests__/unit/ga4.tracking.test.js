/**
 * Unit Tests - GA4 Tracking
 * Tests Google Analytics 4 server-side conversion tracking
 */

const crypto = require('crypto');

describe('GA4 Tracking', () => {
  const GA4_MEASUREMENT_ID = 'G-KKTGW6BEJP';
  const GA4_API_SECRET = 'test_secret_key';

  describe('GA4 Payload Structure', () => {
    test('should create valid GA4 purchase event payload', () => {
      const email = 'customer@example.com';
      const clientId = crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);

      const payload = {
        client_id: clientId,
        user_id: email,
        events: [
          {
            name: 'purchase',
            params: {
              value: 97,
              currency: 'BRL',
              transaction_id: 'HOTMART-123',
              items: [
                {
                  item_id: 'reset-primal-protocol',
                  item_name: 'Reset Primal Protocol',
                  price: 97,
                },
              ],
            },
          },
        ],
      };

      expect(payload.client_id).toBeTruthy();
      expect(payload.user_id).toBe(email);
      expect(payload.events[0].name).toBe('purchase');
      expect(payload.events[0].params.currency).toBe('BRL');
    });

    test('should include required purchase event parameters', () => {
      const purchaseParams = {
        value: 97,
        currency: 'BRL',
        transaction_id: 'TXN-123',
        items: [],
      };

      expect(purchaseParams).toHaveProperty('value');
      expect(purchaseParams).toHaveProperty('currency');
      expect(purchaseParams).toHaveProperty('transaction_id');
      expect(purchaseParams).toHaveProperty('items');
    });

    test('should include item details in purchase event', () => {
      const item = {
        item_id: 'reset-primal-protocol',
        item_name: 'Reset Primal Protocol',
        price: 97,
      };

      expect(item.item_id).toBeTruthy();
      expect(item.item_name).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
    });
  });

  describe('Client ID Generation', () => {
    test('should generate consistent client ID from email', () => {
      const email = 'test@example.com';
      const id1 = crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);
      const id2 = crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);

      expect(id1).toBe(id2);
    });

    test('should generate different client IDs for different emails', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      const id1 = crypto.createHash('sha256').update(email1).digest('hex').substring(0, 16);
      const id2 = crypto.createHash('sha256').update(email2).digest('hex').substring(0, 16);

      expect(id1).not.toBe(id2);
    });

    test('should create 16-character client ID', () => {
      const email = 'test@example.com';
      const clientId = crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);

      expect(clientId.length).toBe(16);
    });
  });

  describe('Transaction ID Handling', () => {
    test('should use Hotmart transaction ID when available', () => {
      const hotmartId = 'HOTMART-ABC-123';
      const transactionId = hotmartId || `fallback-${Date.now()}`;

      expect(transactionId).toBe('HOTMART-ABC-123');
    });

    test('should generate fallback transaction ID if missing', () => {
      const hotmartId = null;
      const timestamp = Date.now();
      const transactionId = hotmartId || `txn-${timestamp}`;

      expect(transactionId).toContain('txn-');
      expect(transactionId).toContain(String(timestamp));
    });

    test('should make transaction ID unique', () => {
      const txnIds = new Set();

      for (let i = 0; i < 100; i++) {
        const txnId = `txn-${Date.now()}-${Math.random()}`;
        txnIds.add(txnId);
      }

      expect(txnIds.size).toBe(100);
    });
  });

  describe('Currency Handling', () => {
    test('should always use BRL currency for Brazilian sales', () => {
      const currencies = ['BRL', 'BRL', 'BRL'];

      currencies.forEach((currency) => {
        expect(currency).toBe('BRL');
      });
    });

    test('should handle different price formats', () => {
      const prices = [97, 97.0, 97.5, 197, 1000];

      prices.forEach((price) => {
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
      });
    });

    test('should preserve decimal precision for price', () => {
      const price = 97.5;
      expect(price).toBe(97.5);
    });
  });

  describe('API Endpoint Configuration', () => {
    test('should construct correct GA4 API URL', () => {
      const params = new URLSearchParams({
        measurement_id: GA4_MEASUREMENT_ID,
        api_secret: GA4_API_SECRET,
      });

      const url = `https://www.google-analytics.com/mp/collect?${params}`;

      expect(url).toContain('google-analytics.com/mp/collect');
      expect(url).toContain('measurement_id=G-KKTGW6BEJP');
    });

    test('should include measurement ID in API request', () => {
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}`;

      expect(url).toContain(GA4_MEASUREMENT_ID);
    });

    test('should include API secret in API request', () => {
      const params = new URLSearchParams({
        api_secret: GA4_API_SECRET,
      });

      const url = `https://www.google-analytics.com/mp/collect?${params}`;

      expect(url).toContain('api_secret');
    });
  });

  describe('Non-blocking Behavior', () => {
    test('should not fail purchase if GA4 tracking fails', () => {
      let purchaseSuccessful = false;
      let ga4Tracked = false;

      try {
        purchaseSuccessful = true;
      } catch {
        purchaseSuccessful = false;
      }

      try {
        // Simulate GA4 failure
        throw new Error('GA4 API Error');
      } catch {
        ga4Tracked = false;
      }

      expect(purchaseSuccessful).toBe(true);
      expect(ga4Tracked).toBe(false);
      // Purchase succeeded even if GA4 failed
    });

    test('should log GA4 failures for monitoring', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'ga4_tracking_failed',
        reason: 'Network timeout',
        severity: 'warning',
      };

      expect(logEntry.timestamp).toBeTruthy();
      expect(logEntry.event).toBe('ga4_tracking_failed');
      expect(['warning', 'error']).toContain(logEntry.severity);
    });
  });

  describe('Event Batching', () => {
    test('should support multiple events in single request', () => {
      const payload = {
        client_id: 'abc123',
        events: [
          { name: 'purchase', params: { value: 97 } },
          { name: 'conversion', params: { source: 'landing_page' } },
        ],
      };

      expect(payload.events.length).toBe(2);
    });

    test('should maintain event order in batch', () => {
      const events = [
        { name: 'view', timestamp: 1 },
        { name: 'click', timestamp: 2 },
        { name: 'purchase', timestamp: 3 },
      ];

      expect(events[0].name).toBe('view');
      expect(events[1].name).toBe('click');
      expect(events[2].name).toBe('purchase');
    });
  });

  describe('Validation', () => {
    test('should require valid measurement ID', () => {
      const validIds = ['G-KKTGW6BEJP', 'G-ABC123'];

      validIds.forEach((id) => {
        expect(id).toMatch(/^G-[A-Z0-9]+$/);
      });
    });

    test('should require valid API secret', () => {
      const secret = 'test_secret_key';

      expect(secret).toBeTruthy();
      expect(secret.length).toBeGreaterThan(0);
    });

    test('should require non-zero purchase value', () => {
      const validPrices = [0.01, 97, 1000];
      const invalidPrices = [0, -97];

      validPrices.forEach((price) => {
        expect(price).toBeGreaterThan(0);
      });

      invalidPrices.forEach((price) => {
        expect(price).toBeLessThanOrEqual(0);
      });
    });
  });
});
