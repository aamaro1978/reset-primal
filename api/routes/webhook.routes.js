const express = require('express');
const { prisma } = require('../config/database');
const { verifyHMACSignature } = require('../utils/crypto');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');
const trackingService = require('../services/tracking.service');
const auditService = require('../services/audit.service');

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// WEBHOOK HOTMART (Legado - refatorar em SPRINT 2)
// ════════════════════════════════════════════════════════════════

/**
 * POST /webhook/hotmart
 * Recebe notificações de compra do Hotmart
 *
 * Fluxo:
 * 1. Validar assinatura HMAC
 * 2. Criar/buscar usuário no banco
 * 3. Criar registro de compra
 * 4. Enviar email via SendGrid
 * 5. Rastrear em GA4 e Facebook
 * 6. Audit log
 */
router.post('/webhook/hotmart', async (req, res, next) => {
  try {
    const signature = req.headers['x-hotmart-signature'];
    const hotmartSecret = process.env.HOTMART_WEBHOOK_SECRET;

    // 1. Validate HMAC signature
    if (!signature || !verifyHMACSignature(req.body, signature, hotmartSecret)) {
      logger.warn('[WEBHOOK] Invalid HMAC signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const buyerEmail = event.data?.buyer?.email;
    const buyerName = event.data?.buyer?.name;
    const purchaseId = event.data?.purchase?.id;
    const purchasePrice = parseFloat(event.data?.purchase?.price || 0);

    logger.info(`[WEBHOOK] Event received: ${event.type}`, { buyerEmail });

    // 2. Create/find user in database
    let user = await prisma.user.findUnique({
      where: { email: buyerEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: buyerEmail,
          name: buyerName,
          role: 'CUSTOMER',
          consentMarketing: true,
          consentDate: new Date()
        }
      });

      logger.info(`[WEBHOOK] New user created: ${buyerEmail}`);
    }

    // 3. Create purchase record
    const product = await prisma.product.findFirst({
      where: { type: 'EBOOK' }
    });

    let purchase = null;
    if (product) {
      purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          productId: product.id,
          hotmartTransactionId: purchaseId,
          hotmartStatus: event.type,
          price: purchasePrice,
          status: 'APPROVED',
          purchasedAt: new Date()
        }
      });

      logger.info(`[WEBHOOK] Purchase created: ${purchase.id}`, { userId: user.id });
    }

    // 4. Send welcome email
    try {
      await emailService.sendEbookWelcomeEmail({
        toEmail: user.email,
        userName: user.name,
        transactionId: purchaseId
      });
    } catch (emailError) {
      logger.error('[WEBHOOK] Failed to send welcome email', emailError);
      // Don't fail the transaction if email fails
    }

    // 5. Track in GA4 and Facebook Pixel
    try {
      await trackingService.trackGA4Purchase({
        userId: user.id,
        purchaseValue: purchasePrice,
        transactionId: purchaseId,
        productName: product?.name || 'Reset Primal E-book'
      });

      await trackingService.trackFacebookPixel({
        userEmail: user.email,
        purchaseValue: purchasePrice,
        transactionId: purchaseId,
        productName: product?.name || 'Reset Primal E-book'
      });
    } catch (trackingError) {
      logger.warn('[WEBHOOK] Failed to track purchase', trackingError);
      // Don't fail the transaction if tracking fails
    }

    // 6. Create audit log
    if (purchase) {
      await auditService.logPurchaseCompleted({
        userId: user.id,
        purchaseId: purchase.id,
        productId: product.id,
        amount: purchasePrice,
        transactionId: purchaseId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(200).json({ success: true, userId: user.id });
  } catch (error) {
    logger.error('[WEBHOOK] Error processing webhook', error);
    next(error);
  }
});

module.exports = router;
