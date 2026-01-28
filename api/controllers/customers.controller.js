const customerService = require('../services/customer.service');
const logger = require('../utils/logger');

class CustomersController {
  /**
   * GET /api/customers
   * List all customers with pagination and filtering
   */
  async listCustomers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await customerService.getCustomers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        sortOrder
      });

      logger.info('[API] Customers list retrieved', {
        page,
        total: result.pagination.total
      });

      res.json(result);
    } catch (error) {
      logger.error('[API] Failed to list customers', error);
      next(error);
    }
  }

  /**
   * GET /api/customers/:id
   * Get detailed customer information
   */
  async getCustomer(req, res, next) {
    try {
      const { id } = req.params;

      const result = await customerService.getCustomerDetails(id);

      logger.info('[API] Customer details retrieved', { customerId: id });

      res.json(result);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      logger.error('[API] Failed to get customer details', error);
      next(error);
    }
  }

  /**
   * GET /api/customers/:id/purchases
   * Get customer purchase history
   */
  async getCustomerPurchases(req, res, next) {
    try {
      const { id } = req.params;
      const {
        status,
        startDate,
        endDate,
        limit = 50
      } = req.query;

      const purchases = await customerService.getCustomerPurchases({
        customerId: id,
        status,
        startDate,
        endDate,
        limit: parseInt(limit)
      });

      logger.info('[API] Customer purchases retrieved', {
        customerId: id,
        count: purchases.length
      });

      res.json({ purchases });
    } catch (error) {
      logger.error('[API] Failed to get customer purchases', error);
      next(error);
    }
  }

  /**
   * GET /api/customers/search
   * Search customers by email or name
   */
  async searchCustomers(req, res, next) {
    try {
      const { q = '', limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({ customers: [] });
      }

      const customers = await customerService.searchCustomers(
        q,
        parseInt(limit)
      );

      logger.debug('[API] Customers search performed', {
        query: q,
        results: customers.length
      });

      res.json({ customers });
    } catch (error) {
      logger.error('[API] Search failed', error);
      next(error);
    }
  }

  /**
   * GET /api/products/:productId/customers
   * Get all customers who purchased a specific product
   */
  async getProductCustomers(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await customerService.getCustomersByProduct(
        productId,
        parseInt(page),
        parseInt(limit)
      );

      logger.info('[API] Product customers retrieved', {
        productId,
        count: result.customers.length
      });

      res.json(result);
    } catch (error) {
      logger.error('[API] Failed to get product customers', error);
      next(error);
    }
  }
}

module.exports = new CustomersController();
