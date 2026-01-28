const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics dashboard
 * Query: ?period=month (week, month, quarter, year)
 * Requires: ADMIN role
 */
router.get(
  '/api/analytics/dashboard',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => analyticsController.getDashboard(req, res, next))
);

/**
 * GET /api/analytics/purchases
 * Get purchases report with filtering
 * Query: ?status=APPROVED&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=50
 * Requires: ADMIN role
 */
router.get(
  '/api/analytics/purchases',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => analyticsController.getPurchasesReport(req, res, next))
);

/**
 * GET /api/analytics/segments
 * Get customer segments for marketing analysis
 * Requires: ADMIN role
 */
router.get(
  '/api/analytics/segments',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler((req, res, next) => analyticsController.getCustomerSegments(req, res, next))
);

module.exports = router;
