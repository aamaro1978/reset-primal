const express = require('express');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const permissionService = require('../services/permission.service');
const { verifyToken } = require('../utils/crypto');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post(
  '/api/auth/register',
  asyncHandler((req, res, next) => authController.register(req, res, next))
);

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post(
  '/api/auth/login',
  asyncHandler((req, res, next) => authController.login(req, res, next))
);

/**
 * POST /api/auth/logout
 * Fazer logout (requer autenticação)
 */
router.post(
  '/api/auth/logout',
  authMiddleware,
  asyncHandler((req, res, next) => authController.logout(req, res, next))
);

/**
 * POST /api/auth/refresh
 * Renovar token
 */
router.post(
  '/api/auth/refresh',
  asyncHandler((req, res, next) => authController.refresh(req, res, next))
);

/**
 * POST /api/auth/forgot-password
 * Solicitar reset de senha
 */
router.post(
  '/api/auth/forgot-password',
  asyncHandler((req, res, next) => authController.forgotPassword(req, res, next))
);

/**
 * GET /api/auth/me
 * Retornar dados do usuário autenticado
 */
router.get(
  '/api/auth/me',
  authMiddleware,
  asyncHandler((req, res, next) => authController.me(req, res, next))
);

/**
 * GET /api/auth/products
 * Get all products user has access to (purchases + subscriptions)
 * Requires: Authentication
 */
router.get(
  '/api/auth/products',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.user.id;
      const products = await permissionService.getUserAccessibleProducts(userId);

      logger.info('[AUTH] User accessible products retrieved', {
        userId,
        count: products.length
      });

      res.json({
        products,
        count: products.length
      });
    } catch (error) {
      logger.error('[AUTH] Failed to get user products', error);
      next(error);
    }
  })
);

/**
 * GET /api/auth/verify-access
 * Verify access to a protected resource (Nginx auth_request subrequest)
 * Used by Nginx to check if user can access /ebook/, /courses/, /premium/, etc.
 *
 * Headers:
 *   - Authorization: Bearer <jwt_token>
 *   - X-Original-URI: The original URI the user tried to access
 *
 * Returns:
 *   - 200 OK: User has access
 *   - 401 Unauthorized: No valid token
 *   - 403 Forbidden: Token valid but user lacks permission
 */
router.get(
  '/api/auth/verify-access',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const originalUri = req.headers['x-original-uri'];

    // 1. Check if token is provided
    if (!token) {
      logger.warn('[AUTH] verify-access: No token provided', {
        uri: originalUri,
        ip: req.ip
      });
      return res.status(401).send('Unauthorized');
    }

    // 2. Verify token validity
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      logger.warn('[AUTH] verify-access: Invalid token', {
        error: error.message,
        uri: originalUri,
        ip: req.ip
      });
      return res.status(401).send('Unauthorized');
    }

    // 3. Check user permissions for the resource
    try {
      const userId = decoded.sub;
      const canAccess = await permissionService.userCanAccessUrl(userId, originalUri);

      if (canAccess) {
        logger.debug('[AUTH] verify-access: Access granted', {
          userId,
          uri: originalUri
        });
        return res.status(200).send('OK');
      } else {
        logger.warn('[AUTH] verify-access: Access denied', {
          userId,
          uri: originalUri,
          reason: 'no_purchase_or_subscription'
        });
        return res.status(403).send('Forbidden');
      }
    } catch (error) {
      logger.error('[AUTH] verify-access: Error checking permissions', {
        error: error.message,
        uri: originalUri
      });
      // Fail closed - deny access on error
      return res.status(403).send('Forbidden');
    }
  })
);

module.exports = router;
