const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Get comprehensive analytics dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const { period = 'month' } = req.query;

      const data = await analyticsService.getDashboard(period);

      logger.info('[API] Analytics dashboard retrieved', { period });

      res.json(data);
    } catch (error) {
      logger.error('[API] Failed to get dashboard', error);
      next(error);
    }
  }

  /**
   * GET /api/analytics/purchases
   * Get purchases report with filtering and pagination
   */
  async getPurchasesReport(req, res, next) {
    try {
      const {
        status = 'APPROVED',
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const result = await analyticsService.getPurchasesReport({
        status,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      logger.info('[API] Purchases report retrieved', {
        status,
        count: result.purchases.length
      });

      res.json(result);
    } catch (error) {
      logger.error('[API] Failed to get purchases report', error);
      next(error);
    }
  }

  /**
   * GET /api/analytics/segments
   * Get customer segments for marketing analysis
   */
  async getCustomerSegments(req, res, next) {
    try {
      const segments = await analyticsService.getCustomerSegments();

      logger.info('[API] Customer segments retrieved');

      res.json({ segments });
    } catch (error) {
      logger.error('[API] Failed to get customer segments', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
