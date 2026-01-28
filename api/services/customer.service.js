const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class CustomerService {
  /**
   * Get paginated list of customers
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-indexed)
   * @param {number} params.limit - Results per page (default: 50, max: 500)
   * @param {string} params.search - Search by name or email
   * @param {string} params.sortBy - Sort field: 'createdAt', 'totalSpent', 'lastPurchaseAt' (default: 'createdAt')
   * @param {string} params.sortOrder - 'asc' or 'desc' (default: 'desc')
   * @returns {Promise<Object>} - Customers list with pagination info
   */
  async getCustomers({
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    try {
      // Validate limits
      const validLimit = Math.min(Math.max(1, limit), 500);
      const validPage = Math.max(1, page);
      const skip = (validPage - 1) * validLimit;

      // Validate sort parameters
      const validSortBy = ['createdAt', 'email', 'name'].includes(sortBy)
        ? sortBy
        : 'createdAt';
      const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      // Build search filter
      const where = {
        deletedAt: null,
        ...(search && {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } }
          ]
        })
      };

      // Get total count
      const total = await prisma.user.count({ where });

      // Get customers with aggregated purchase data
      const customers = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          purchases: {
            where: { status: 'APPROVED' },
            select: {
              price: true,
              purchasedAt: true,
              status: true
            }
          }
        },
        orderBy: {
          [validSortBy]: validSortOrder
        },
        take: validLimit,
        skip
      });

      // Aggregate purchase data for each customer
      const customersWithStats = customers.map(customer => {
        const purchases = customer.purchases;
        const totalPurchases = purchases.length;
        const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);
        const lastPurchaseAt = purchases.length > 0
          ? purchases.sort((a, b) => b.purchasedAt - a.purchasedAt)[0].purchasedAt
          : null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: customer.role,
          totalPurchases,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          lastPurchaseAt,
          createdAt: customer.createdAt,
          lastLoginAt: customer.lastLoginAt
        };
      });

      const pages = Math.ceil(total / validLimit);

      logger.debug('[CUSTOMER] List fetched', {
        page: validPage,
        limit: validLimit,
        total,
        search
      });

      return {
        customers: customersWithStats,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          pages,
          hasNext: validPage < pages,
          hasPrev: validPage > 1
        }
      };
    } catch (error) {
      logger.error('[CUSTOMER] Failed to fetch customers', error);
      throw error;
    }
  }

  /**
   * Get detailed customer information
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} - Customer details with purchases, activity, etc.
   */
  async getCustomerDetails(customerId) {
    try {
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          consentMarketing: true,
          consentDataSharing: true,
          consentDate: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          deletedAt: true
        }
      });

      if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
      }

      // Get purchase history
      const purchases = await prisma.purchase.findMany({
        where: { userId: customerId },
        select: {
          id: true,
          status: true,
          price: true,
          purchasedAt: true,
          refundedAt: true,
          hotmartTransactionId: true,
          product: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { purchasedAt: 'desc' }
      });

      // Get session activity
      const sessions = await prisma.session.findMany({
        where: { userId: customerId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          isValid: true,
          ipAddress: true,
          userAgent: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Get audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: { userId: customerId },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Calculate stats
      const stats = {
        totalPurchases: purchases.length,
        totalSpent: parseFloat(purchases
          .filter(p => p.status === 'APPROVED')
          .reduce((sum, p) => sum + p.price, 0)
          .toFixed(2)),
        activeSessions: sessions.filter(s => s.isValid).length,
        lastActivity: auditLogs.length > 0 ? auditLogs[0].createdAt : null
      };

      logger.debug('[CUSTOMER] Details fetched', { customerId });

      return {
        customer,
        stats,
        purchases: purchases.map(p => ({
          ...p,
          metadata: p.metadata ? JSON.parse(p.metadata) : {}
        })),
        recentActivity: {
          sessions: sessions.slice(0, 5),
          auditLogs: auditLogs.map(log => ({
            ...log,
            metadata: log.metadata ? JSON.parse(log.metadata) : {}
          }))
        }
      };
    } catch (error) {
      logger.error('[CUSTOMER] Failed to fetch customer details', error);
      throw error;
    }
  }

  /**
   * Get customer purchase history with filtering
   * @param {Object} params - Query parameters
   * @param {string} params.customerId - Customer ID
   * @param {string} params.status - Purchase status filter
   * @param {Date} params.startDate - Filter purchases after this date
   * @param {Date} params.endDate - Filter purchases before this date
   * @param {number} params.limit - Results limit (default: 50)
   * @returns {Promise<Array>} - Purchase records
   */
  async getCustomerPurchases({
    customerId,
    status,
    startDate,
    endDate,
    limit = 50
  }) {
    try {
      const where = {
        userId: customerId,
        ...(status && { status }),
        ...(startDate || endDate) && {
          purchasedAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        }
      };

      const purchases = await prisma.purchase.findMany({
        where,
        select: {
          id: true,
          status: true,
          price: true,
          currency: true,
          purchasedAt: true,
          refundedAt: true,
          hotmartTransactionId: true,
          product: {
            select: {
              id: true,
              name: true,
              type: true,
              slug: true
            }
          }
        },
        orderBy: { purchasedAt: 'desc' },
        take: limit
      });

      logger.debug('[CUSTOMER] Purchases fetched', {
        customerId,
        count: purchases.length
      });

      return purchases;
    } catch (error) {
      logger.error('[CUSTOMER] Failed to fetch customer purchases', error);
      throw error;
    }
  }

  /**
   * Search customers by email or name
   * @param {string} query - Search query
   * @param {number} limit - Results limit (default: 20)
   * @returns {Promise<Array>} - Matching customers
   */
  async searchCustomers(query, limit = 20) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const customers = await prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { email: { contains: query } },
            { name: { contains: query } }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        },
        take: limit
      });

      return customers;
    } catch (error) {
      logger.error('[CUSTOMER] Search failed', error);
      throw error;
    }
  }

  /**
   * Get customers by purchase product
   * @param {string} productId - Product ID
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} - Customers with pagination
   */
  async getCustomersByProduct(productId, page = 1, limit = 50) {
    try {
      const validLimit = Math.min(Math.max(1, limit), 500);
      const validPage = Math.max(1, page);
      const skip = (validPage - 1) * validLimit;

      const total = await prisma.purchase.count({
        where: {
          productId,
          status: 'APPROVED'
        }
      });

      const purchases = await prisma.purchase.findMany({
        where: {
          productId,
          status: 'APPROVED'
        },
        select: {
          id: true,
          price: true,
          purchasedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true
            }
          }
        },
        orderBy: { purchasedAt: 'desc' },
        take: validLimit,
        skip
      });

      const pages = Math.ceil(total / validLimit);

      return {
        customers: purchases.map(p => ({
          ...p.user,
          purchaseId: p.id,
          purchasePrice: p.price,
          purchasedAt: p.purchasedAt
        })),
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          pages
        }
      };
    } catch (error) {
      logger.error('[CUSTOMER] Failed to fetch product customers', error);
      throw error;
    }
  }
}

module.exports = new CustomerService();
