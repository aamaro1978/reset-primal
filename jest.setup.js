// Jest Setup File
// Configure test environment variables and global test utilities

// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite::memory:';

// Mock external services
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ id: 'test-message-id' }])
}));

// Global test utilities
global.testUtils = {
  // Helper to create test purchase event
  createPurchaseEvent: (overrides = {}) => ({
    event: 'PURCHASE_COMPLETE',
    data: {
      buyer: {
        name: 'Test Buyer',
        email: 'test@example.com',
        ...overrides.buyer
      },
      purchase: {
        id: 'test-purchase-123',
        price: 97,
        ...overrides.purchase
      }
    }
  }),

  // Helper to create HMAC signature
  createSignature: (body, secret) => {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
  }
};

// Suppress console logs in tests unless DEBUG=true
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
