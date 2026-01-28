const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class PermissionService {
  /**
   * Check if user can access a specific URL based on purchases
   * Used by Nginx auth_request directive
   * @param {string} userId - User ID
   * @param {string} url - Original request URL from Nginx
   * @returns {Promise<boolean>} - True if user can access resource
   */
  async userCanAccessUrl(userId, url) {
    try {
      // Parse the URL to determine what resource is being accessed
      if (!url) {
        logger.warn('[PERMISSION] Access check with empty URL', { userId });
        return false;
      }

      // Check if accessing e-book content
      if (url.startsWith('/ebook/')) {
        return this.userHasEbookAccess(userId);
      }

      // Check if accessing course content
      if (url.startsWith('/courses/')) {
        const courseSlug = this._extractResourceSlug(url);
        return this.userHasCourseAccess(userId, courseSlug);
      }

      // Check if accessing subscription-only content
      if (url.startsWith('/premium/')) {
        return this.userHasActiveSubscription(userId);
      }

      // By default, deny access to protected resources
      logger.warn('[PERMISSION] Unknown protected resource', { url, userId });
      return false;
    } catch (error) {
      logger.error('[PERMISSION] Error checking URL access', error);
      // Fail closed - deny access on error
      return false;
    }
  }

  /**
   * Check if user has purchased the e-book product
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userHasEbookAccess(userId) {
    try {
      const ebookProduct = await prisma.product.findFirst({
        where: { type: 'EBOOK', deletedAt: null }
      });

      if (!ebookProduct) {
        logger.warn('[PERMISSION] E-book product not found');
        return false;
      }

      const purchase = await prisma.purchase.findFirst({
        where: {
          userId,
          productId: ebookProduct.id,
          status: 'APPROVED',
          refundedAt: null
        }
      });

      const hasAccess = !!purchase;

      logger.debug('[PERMISSION] E-book access check', {
        userId,
        hasAccess,
        purchaseId: purchase?.id
      });

      return hasAccess;
    } catch (error) {
      logger.error('[PERMISSION] Error checking e-book access', error);
      return false;
    }
  }

  /**
   * Check if user has purchased a specific course
   * @param {string} userId - User ID
   * @param {string} courseSlug - Course slug
   * @returns {Promise<boolean>}
   */
  async userHasCourseAccess(userId, courseSlug) {
    try {
      const course = await prisma.product.findFirst({
        where: { slug: courseSlug, type: 'COURSE', deletedAt: null }
      });

      if (!course) {
        logger.warn('[PERMISSION] Course not found', { courseSlug });
        return false;
      }

      const purchase = await prisma.purchase.findFirst({
        where: {
          userId,
          productId: course.id,
          status: 'APPROVED',
          refundedAt: null
        }
      });

      const hasAccess = !!purchase;

      logger.debug('[PERMISSION] Course access check', {
        userId,
        courseSlug,
        hasAccess
      });

      return hasAccess;
    } catch (error) {
      logger.error('[PERMISSION] Error checking course access', error);
      return false;
    }
  }

  /**
   * Check if user has an active subscription
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userHasActiveSubscription(userId) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        }
      });

      const hasAccess = !!subscription;

      logger.debug('[PERMISSION] Subscription access check', {
        userId,
        hasAccess
      });

      return hasAccess;
    } catch (error) {
      logger.error('[PERMISSION] Error checking subscription access', error);
      return false;
    }
  }

  /**
   * Check if user can perform admin actions
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userIsAdmin(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      return user?.role === 'ADMIN';
    } catch (error) {
      logger.error('[PERMISSION] Error checking admin status', error);
      return false;
    }
  }

  /**
   * Check if user can perform moderator actions
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userIsModerator(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      return ['ADMIN', 'MODERATOR'].includes(user?.role);
    } catch (error) {
      logger.error('[PERMISSION] Error checking moderator status', error);
      return false;
    }
  }

  /**
   * Get all products user has access to
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of product objects
   */
  async getUserAccessibleProducts(userId) {
    try {
      const purchases = await prisma.purchase.findMany({
        where: {
          userId,
          status: 'APPROVED',
          refundedAt: null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true
            }
          }
        }
      });

      const products = purchases.map(p => p.product);

      // Add active subscriptions
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true
            }
          }
        }
      });

      products.push(...subscriptions.map(s => s.product));

      // Remove duplicates
      const uniqueProducts = Array.from(
        new Map(products.map(p => [p.id, p])).values()
      );

      logger.debug('[PERMISSION] User accessible products', {
        userId,
        count: uniqueProducts.length
      });

      return uniqueProducts;
    } catch (error) {
      logger.error('[PERMISSION] Error fetching user accessible products', error);
      return [];
    }
  }

  /**
   * Helper: Extract resource slug from URL
   * @private
   */
  _extractResourceSlug(url) {
    // Extract slug from URL like /courses/python-basics/
    const match = url.match(/\/[^/]+\/([^/]+)\//);
    return match ? match[1] : null;
  }
}

module.exports = new PermissionService();
