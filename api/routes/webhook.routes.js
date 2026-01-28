const express = require('express');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Configuração
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET;

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

    // 1. Validar assinatura HMAC
    if (!signature || !verifyHotmartSignature(req.body, signature)) {
      logger.warn('[WEBHOOK] Assinatura HMAC inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const event = req.body;

    logger.info(`[WEBHOOK] Evento recebido: ${event.type}`);

    // 2. NOVO: Criar/buscar usuário no banco
    let user = await prisma.user.findUnique({
      where: { email: event.data.buyer.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: event.data.buyer.email,
          name: event.data.buyer.name,
          role: 'CUSTOMER',
          consentMarketing: true,
          consentDate: new Date()
        }
      });

      logger.info(`[WEBHOOK] Novo usuário criado: ${user.email}`);
    }

    // 3. NOVO: Criar registro de compra
    const product = await prisma.product.findFirst({
      where: { type: 'EBOOK' }
    });

    if (product) {
      const purchase = await prisma.purchase.create({
        data: {
          userId: user.id,
          productId: product.id,
          hotmartTransactionId: event.data.purchase.id,
          hotmartStatus: event.type,
          price: parseFloat(event.data.purchase.price),
          status: 'APPROVED',
          purchasedAt: new Date()
        }
      });

      logger.info(`[WEBHOOK] Compra criada: ${purchase.id}`);
    }

    // 4. Enviar email via SendGrid
    try {
      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: '🎉 Seu E-book Reset Primal está pronto!',
        html: `
          <h2>Bem-vindo ao Reset Primal!</h2>
          <p>Obrigado pela compra, ${user.name}!</p>
          <p>Seu e-book está pronto para download.</p>
          <p>Acesse: <a href="https://resetprimal.com.br/ebook/">resetprimal.com.br/ebook</a></p>
          <hr>
          <p><small>Transação: ${event.data.purchase.id}</small></p>
        `
      };

      await sgMail.send(msg);
      logger.info(`[WEBHOOK] Email enviado: ${user.email}`);
    } catch (emailError) {
      logger.error('[WEBHOOK] Erro ao enviar email', emailError);
      // Não falhar a transação se email falhar
    }

    // 5. Rastrear em GA4 e Facebook (simplificado por enquanto)
    if (process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
      try {
        // GA4 Measurement Protocol
        await fetch('https://www.google-analytics.com/mp/collect', {
          method: 'POST',
          body: JSON.stringify({
            measurement_id: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
            api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET,
            client_id: user.id.substring(0, 32),
            events: [
              {
                name: 'purchase',
                params: {
                  value: event.data.purchase.price,
                  currency: 'BRL',
                  transaction_id: event.data.purchase.id
                }
              }
            ]
          })
        });

        logger.debug('[WEBHOOK] GA4 rastreado');
      } catch (gaError) {
        logger.warn('[WEBHOOK] Erro ao rastrear GA4', gaError);
      }
    }

    // 6. Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'purchase_completed',
        entity: 'purchase',
        metadata: JSON.stringify({
          productId: product?.id,
          transactionId: event.data.purchase.id,
          amount: event.data.purchase.price
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('[WEBHOOK] Erro ao processar webhook', error);
    next(error);
  }
});

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function verifyHotmartSignature(body, signature) {
  try {
    const computedSignature = crypto
      .createHmac('sha256', HOTMART_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    logger.error('[WEBHOOK] Erro ao verificar HMAC', error);
    return false;
  }
}

module.exports = router;
