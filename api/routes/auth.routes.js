const express = require('express');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

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
 * GET /api/auth/verify-access
 * Verificar acesso a um recurso (Nginx auth_request)
 * Header: X-Original-URI (URI que o usuário está tentando acessar)
 */
router.get(
  '/api/auth/verify-access',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const originalUri = req.headers['x-original-uri'];

    if (!token) {
      return res.status(401).send('Unauthorized');
    }

    try {
      const { verifyToken } = require('../utils/crypto');
      const decoded = verifyToken(token);

      // TODO FASE 1: Implementar permissionService
      // Por agora, qualquer usuário autenticado pode acessar
      res.status(200).send('OK');
    } catch (error) {
      res.status(401).send('Unauthorized');
    }
  })
);

module.exports = router;
