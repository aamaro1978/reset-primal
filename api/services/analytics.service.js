const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard
   * @param {Object} params - Query parameters
   * @param {string} params.period - 'week', 'month', 'quarter', 'year' (default: 'month')
   * @returns {Promise<Object>} - Complete dashboard data
   */
  async getDashboard(period = 'month') {
    try {
      const startDate = this._getPeriodStartDate(period);
      const now = new Date();

      // Parallel queries for performance
      const [overview, topProducts, topCustomers, revenueTimeSeries, registrationTimeSeries] =
        await Promise.all([
          this._getOverview(startDate, now),
          this._getTopProducts(startDate, now),
          this._getTopCustomers(10),
          this._getRevenueTimeSeries(startDate, now, period),
          this._getRegistrationTimeSeries(startDate, now, period),
        ]);

      logger.debug('[ANALYTICS] Dashboard data fetched', { period });

      return {
        period,
        dateRange: {
          start: startDate,
          end: now,
        },
        overview,
        topProducts,
        topCustomers,
        timeSeries: {
          revenue: revenueTimeSeries,
          registrations: registrationTimeSeries,
        },
      };
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch dashboard', error);
      throw error;
    }
  }

  /**
   * Get overview metrics
   * @private
   */
  async _getOverview(startDate, endDate) {
    try {
      // Total counts
      const [totalCustomers, newCustomers, totalPurchases] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null, role: 'CUSTOMER' } }),
        prisma.user.count({
          where: {
            deletedAt: null,
            role: 'CUSTOMER',
            createdAt: { gte: startDate },
          },
        }),
        prisma.purchase.count({
          where: {
            status: 'APPROVED',
            purchasedAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      // Revenue calculations
      const periodRevenue = await prisma.purchase.aggregate({
        where: {
          status: 'APPROVED',
          purchasedAt: { gte: startDate, lte: endDate },
        },
        _sum: { price: true },
      });

      const allTimeRevenue = await prisma.purchase.aggregate({
        where: { status: 'APPROVED' },
        _sum: { price: true },
      });

      const totalRevenue = parseFloat((allTimeRevenue._sum.price || 0).toFixed(2));
      const periodTotal = parseFloat((periodRevenue._sum.price || 0).toFixed(2));
      const avgTicket =
        totalPurchases > 0 ? parseFloat((periodTotal / totalPurchases).toFixed(2)) : 0;

      // Conversion rate (estimated: purchases / customers)
      const conversionRate =
        totalCustomers > 0 ? parseFloat(((totalPurchases / totalCustomers) * 100).toFixed(2)) : 0;

      return {
        totalCustomers,
        newCustomersThisPeriod: newCustomers,
        totalRevenue,
        periodRevenue: periodTotal,
        totalPurchases,
        periodPurchases: totalPurchases,
        averageTicketValue: avgTicket,
        conversionRate,
      };
    } catch (error) {
      logger.error('[ANALYTICS] Failed to calculate overview', error);
      throw error;
    }
  }

  /**
   * Get top products by revenue
   * @private
   */
  async _getTopProducts(startDate, endDate) {
    try {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          purchases: {
            some: {
              status: 'APPROVED',
              purchasedAt: { gte: startDate, lte: endDate },
            },
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          slug: true,
          _count: {
            select: { purchases: true },
          },
          purchases: {
            where: { status: 'APPROVED' },
            select: { price: true },
          },
        },
      });

      return products
        .map((product) => ({
          id: product.id,
          name: product.name,
          type: product.type,
          slug: product.slug,
          totalSales: product._count.purchases,
          totalRevenue: parseFloat(
            product.purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)
          ),
          averagePrice: parseFloat(
            (
              product.purchases.reduce((sum, p) => sum + p.price, 0) / product._count.purchases
            ).toFixed(2)
          ),
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch top products', error);
      throw error;
    }
  }

  /**
   * Get top customers by spending
   * @private
   */
  async _getTopCustomers(limit = 10) {
    try {
      const customers = await prisma.user.findMany({
        where: {
          deletedAt: null,
          role: 'CUSTOMER',
          purchases: {
            some: { status: 'APPROVED' },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          purchases: {
            where: { status: 'APPROVED' },
            select: { price: true, purchasedAt: true },
          },
        },
        take: limit * 2, // Get extra to sort properly
      });

      return customers
        .map((customer) => ({
          id: customer.id,
          email: customer.email,
          name: customer.name,
          totalSpent: parseFloat(
            customer.purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)
          ),
          purchaseCount: customer.purchases.length,
          lastPurchaseAt:
            customer.purchases.length > 0
              ? customer.purchases.sort((a, b) => b.purchasedAt - a.purchasedAt)[0].purchasedAt
              : null,
          joinedAt: customer.createdAt,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch top customers', error);
      throw error;
    }
  }

  /**
   * Get revenue time series
   * @private
   */
  async _getRevenueTimeSeries(startDate, endDate, period) {
    try {
      const purchases = await prisma.purchase.findMany({
        where: {
          status: 'APPROVED',
          purchasedAt: { gte: startDate, lte: endDate },
        },
        select: {
          price: true,
          purchasedAt: true,
        },
      });

      // Group by period
      const grouped = this._groupByPeriod(purchases, period);

      return Object.entries(grouped).map(([date, purchases]) => ({
        date,
        revenue: parseFloat(purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)),
        transactions: purchases.length,
        averageValue: parseFloat(
          (purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length).toFixed(2)
        ),
      }));
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch revenue time series', error);
      throw error;
    }
  }

  /**
   * Get registration time series
   * @private
   */
  async _getRegistrationTimeSeries(startDate, endDate, period) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          deletedAt: null,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          createdAt: true,
        },
      });

      // Group by period
      const grouped = this._groupByPeriod(
        users.map((u) => ({ createdAt: u.createdAt })),
        period
      );

      return Object.entries(grouped).map(([date, users]) => ({
        date,
        registrations: users.length,
      }));
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch registration time series', error);
      throw error;
    }
  }

  /**
   * Get a list of purchases for revenue reporting
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by purchase status
   * @param {Date} params.startDate - Filter from date
   * @param {Date} params.endDate - Filter to date
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} - Purchases with pagination
   */
  async getPurchasesReport({ status = 'APPROVED', startDate, endDate, page = 1, limit = 50 }) {
    try {
      const validLimit = Math.min(Math.max(1, limit), 500);
      const validPage = Math.max(1, page);
      const skip = (validPage - 1) * validLimit;

      const where = {
        ...(status && { status }),
        ...((startDate || endDate) && {
          purchasedAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }),
      };

      const [total, purchases] = await Promise.all([
        prisma.purchase.count({ where }),
        prisma.purchase.findMany({
          where,
          select: {
            id: true,
            status: true,
            price: true,
            purchasedAt: true,
            hotmartTransactionId: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
            product: {
              select: {
                name: true,
                type: true,
              },
            },
          },
          orderBy: { purchasedAt: 'desc' },
          take: validLimit,
          skip,
        }),
      ]);

      const pages = Math.ceil(total / validLimit);

      return {
        purchases,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          pages,
        },
        totals: {
          totalRevenue: purchases.reduce((sum, p) => sum + p.price, 0),
          totalTransactions: total,
        },
      };
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch purchases report', error);
      throw error;
    }
  }

  /**
   * Get customer segments for marketing
   * @returns {Promise<Object>} - Customer segments
   */
  async getCustomerSegments() {
    try {
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER', deletedAt: null },
        select: {
          id: true,
          email: true,
          createdAt: true,
          purchases: {
            where: { status: 'APPROVED' },
            select: { price: true, purchasedAt: true },
          },
        },
      });

      // Segment customers
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const segments = {
        active: customers.filter((c) => {
          const lastPurchase =
            c.purchases.length > 0
              ? c.purchases.sort((a, b) => b.purchasedAt - a.purchasedAt)[0].purchasedAt
              : null;
          return lastPurchase && lastPurchase >= thirtyDaysAgo;
        }),
        atRisk: customers.filter((c) => {
          const lastPurchase =
            c.purchases.length > 0
              ? c.purchases.sort((a, b) => b.purchasedAt - a.purchasedAt)[0].purchasedAt
              : null;
          return lastPurchase && lastPurchase < thirtyDaysAgo && lastPurchase >= ninetyDaysAgo;
        }),
        inactive: customers.filter((c) => {
          const lastPurchase =
            c.purchases.length > 0
              ? c.purchases.sort((a, b) => b.purchasedAt - a.purchasedAt)[0].purchasedAt
              : null;
          return !lastPurchase || lastPurchase < ninetyDaysAgo;
        }),
        neverPurchased: customers.filter((c) => c.purchases.length === 0),
      };

      return Object.entries(segments).reduce((acc, [key, customers]) => {
        acc[key] = {
          count: customers.length,
          percentage: parseFloat(((customers.length / customers.length) * 100).toFixed(2)),
          avgSpending:
            customers.length > 0
              ? parseFloat(
                  (
                    customers.reduce(
                      (sum, c) => sum + c.purchases.reduce((s, p) => s + p.price, 0),
                      0
                    ) / customers.length
                  ).toFixed(2)
                )
              : 0,
        };
        return acc;
      }, {});
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch customer segments', error);
      throw error;
    }
  }

  /**
   * Helper: Get period start date
   * @private
   */
  _getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Helper: Group data by period
   * @private
   */
  _groupByPeriod(items, period) {
    const grouped = {};

    items.forEach((item) => {
      const date = item.purchasedAt || item.createdAt;
      let key;

      switch (period) {
        case 'week':
          key = date.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().substring(0, 7); // YYYY-MM
          break;
        case 'quarter': {
          const q = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${q}`;
          break;
        }
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || []).concat(item);
    });

    return grouped;
  }
}

module.exports = new AnalyticsService();
