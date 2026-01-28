const express = require('express');
const customersController = require('../controllers/customers.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/customers
 * List customers with pagination and search
 * Query: ?page=1&limit=50&search=name&sortBy=createdAt&sortOrder=desc
 * Requires: ADMIN role
 */
router.get(
  '/api/customers',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => customersController.listCustomers(req, res, next))
);

/**
 * GET /api/customers/search
 * Search customers by email or name
 * Query: ?q=search_term&limit=20
 * Requires: ADMIN role
 */
router.get(
  '/api/customers/search',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => customersController.searchCustomers(req, res, next))
);

/**
 * GET /api/customers/:id
 * Get detailed customer information
 * Requires: ADMIN role
 */
router.get(
  '/api/customers/:id',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => customersController.getCustomer(req, res, next))
);

/**
 * GET /api/customers/:id/purchases
 * Get customer purchase history
 * Query: ?status=APPROVED&startDate=2025-01-01&endDate=2025-01-31&limit=50
 * Requires: ADMIN role
 */
router.get(
  '/api/customers/:id/purchases',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => customersController.getCustomerPurchases(req, res, next))
);

/**
 * GET /api/products/:productId/customers
 * Get all customers who purchased a specific product
 * Query: ?page=1&limit=50
 * Requires: ADMIN role
 */
router.get(
  '/api/products/:productId/customers',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => customersController.getProductCustomers(req, res, next))
);

module.exports = router;
