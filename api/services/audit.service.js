const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log an action to the audit trail
   * @param {Object} params - Audit log parameters
   * @param {string} params.userId - User ID (optional, can be null for anonymous actions)
   * @param {string} params.action - Action name (e.g., 'user_login', 'purchase_completed')
   * @param {string} params.entity - Entity type (e.g., 'user', 'purchase')
   * @param {string} params.entityId - Entity ID being modified
   * @param {Object} params.metadata - Additional metadata as JSON
   * @param {string} params.ipAddress - IP address of the request
   * @param {string} params.userAgent - User agent string
   * @returns {Promise<Object>} - Created audit log record
   */
  async log({
    userId,
    action,
    entity,
    entityId,
    metadata = {},
    ipAddress,
    userAgent
  }) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          metadata: JSON.stringify(metadata),
          ipAddress,
          userAgent
        }
      });

      logger.debug('[AUDIT] Action logged', {
        action,
        entity,
        userId,
        entityId
      });

      return auditLog;
    } catch (error) {
      logger.error('[AUDIT] Failed to log action', {
        action,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Log a purchase completion
   * @param {Object} params - Purchase parameters
   * @param {string} params.userId - User ID
   * @param {string} params.purchaseId - Purchase ID
   * @param {string} params.productId - Product ID
   * @param {number} params.amount - Purchase amount
   * @param {string} params.transactionId - External transaction ID (Hotmart, etc)
   * @param {string} params.ipAddress - IP address
   * @param {string} params.userAgent - User agent
   * @returns {Promise<void>}
   */
  async logPurchaseCompleted({
    userId,
    purchaseId,
    productId,
    amount,
    transactionId,
    ipAddress,
    userAgent
  }) {
    return this.log({
      userId,
      action: 'purchase_completed',
      entity: 'purchase',
      entityId: purchaseId,
      metadata: {
        productId,
        amount,
        transactionId
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a user registration
   * @param {Object} params - Registration parameters
   * @param {string} params.userId - User ID
   * @param {string} params.email - User email
   * @param {string} params.ipAddress - IP address
   * @param {string} params.userAgent - User agent
   * @returns {Promise<void>}
   */
  async logUserRegistered({
    userId,
    email,
    ipAddress,
    userAgent
  }) {
    return this.log({
      userId,
      action: 'user_registered',
      entity: 'user',
      entityId: userId,
      metadata: { email },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a user login
   * @param {Object} params - Login parameters
   * @param {string} params.userId - User ID
   * @param {string} params.ipAddress - IP address
   * @param {string} params.userAgent - User agent
   * @returns {Promise<void>}
   */
  async logUserLogin({
    userId,
    ipAddress,
    userAgent
  }) {
    return this.log({
      userId,
      action: 'user_login',
      entity: 'user',
      entityId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a user logout
   * @param {Object} params - Logout parameters
   * @param {string} params.userId - User ID
   * @param {string} params.sessionId - Session ID
   * @param {string} params.ipAddress - IP address
   * @returns {Promise<void>}
   */
  async logUserLogout({
    userId,
    sessionId,
    ipAddress
  }) {
    return this.log({
      userId,
      action: 'user_logout',
      entity: 'session',
      entityId: sessionId,
      ipAddress
    });
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to return (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Array>} - Audit log records
   */
  async getUserLogs(userId, limit = 50, offset = 0) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true
        }
      });

      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));
    } catch (error) {
      logger.error('[AUDIT] Failed to retrieve user logs', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   * @param {string} entity - Entity type (e.g., 'purchase')
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} - Audit log records
   */
  async getEntityLogs(entity, entityId) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { entity, entityId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          action: true,
          metadata: true,
          ipAddress: true,
          createdAt: true
        }
      });

      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));
    } catch (error) {
      logger.error('[AUDIT] Failed to retrieve entity logs', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
