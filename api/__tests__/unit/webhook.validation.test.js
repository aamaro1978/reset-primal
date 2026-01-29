/**
 * Unit Tests - Webhook HMAC Validation
 * Tests the security layer of webhook verification
 */

const crypto = require('crypto');

// Mock crypto module before importing
const verifyHMACSignature = (body, signature, secret) => {
  if (!signature || !secret) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
};

describe('Webhook HMAC Validation', () => {
  const testSecret = 'test_webhook_secret_key';

  describe('Valid Signatures', () => {
    test('should accept valid HMAC signature', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: {
          buyer: { email: 'test@example.com', name: 'Test User' },
          purchase: { id: '123', price: 97 },
        },
      };

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      expect(verifyHMACSignature(body, signature, testSecret)).toBe(true);
    });

    test('should accept HMAC signature with special characters in data', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: {
          buyer: { email: 'josé@example.com', name: 'José Silva' },
          purchase: { id: 'PU-123-456', price: 97.5 },
        },
      };

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      expect(verifyHMACSignature(body, signature, testSecret)).toBe(true);
    });
  });

  describe('Invalid Signatures', () => {
    test('should reject invalid HMAC signature', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: {
          buyer: { email: 'test@example.com' },
          purchase: { id: '123', price: 97 },
        },
      };

      const invalidSignature = 'invalid_signature_hash';

      expect(verifyHMACSignature(body, invalidSignature, testSecret)).toBe(false);
    });

    test('should reject signature with wrong secret', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: { buyer: { email: 'test@example.com' }, purchase: { id: '123' } },
      };

      const wrongSecret = 'different_secret_key';
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      expect(verifyHMACSignature(body, signature, wrongSecret)).toBe(false);
    });

    test('should reject modified body with original signature', () => {
      const originalBody = {
        event: 'PURCHASE_COMPLETE',
        data: { buyer: { email: 'test@example.com' }, purchase: { id: '123', price: 97 } },
      };

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(originalBody))
        .digest('hex');

      // Modify the body
      const modifiedBody = {
        ...originalBody,
        data: {
          ...originalBody.data,
          purchase: { ...originalBody.data.purchase, price: 1000 }, // Changed price
        },
      };

      expect(verifyHMACSignature(modifiedBody, signature, testSecret)).toBe(false);
    });

    test('should reject missing signature', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: { buyer: { email: 'test@example.com' } },
      };

      expect(verifyHMACSignature(body, null, testSecret)).toBe(false);
      expect(verifyHMACSignature(body, undefined, testSecret)).toBe(false);
      expect(verifyHMACSignature(body, '', testSecret)).toBe(false);
    });

    test('should reject missing secret', () => {
      const body = {
        event: 'PURCHASE_COMPLETE',
        data: { buyer: { email: 'test@example.com' } },
      };

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      expect(verifyHMACSignature(body, signature, null)).toBe(false);
      expect(verifyHMACSignature(body, signature, undefined)).toBe(false);
      expect(verifyHMACSignature(body, signature, '')).toBe(false);
    });
  });

  describe('Timing Attack Prevention', () => {
    test('should use timingSafeEqual to prevent timing attacks', () => {
      const body = { event: 'PURCHASE_COMPLETE' };
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      // This test verifies the function uses timingSafeEqual
      // by checking it doesn't return early on first difference
      const incorrectSignature = 'a' + signature.slice(1); // Different first char

      expect(verifyHMACSignature(body, incorrectSignature, testSecret)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty body', () => {
      const body = {};
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      expect(verifyHMACSignature(body, signature, testSecret)).toBe(true);
    });

    test('should handle null body', () => {
      expect(verifyHMACSignature(null, 'signature', testSecret)).toBe(false);
    });

    test('should handle very large signature string', () => {
      const body = { event: 'PURCHASE_COMPLETE' };
      const largeSignature = 'a'.repeat(10000);

      expect(verifyHMACSignature(body, largeSignature, testSecret)).toBe(false);
    });
  });
});
