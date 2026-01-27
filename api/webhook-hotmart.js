/**
 * WEBHOOK HOTMART - Reset Primal
 * Recebe notificações de compra e dispara email + conversão
 */

const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

// ========================================
// CONFIGURAÇÃO
// ========================================

const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET;
const HOTMART_AFFILIATE_LINK = process.env.HOTMART_AFFILIATE_LINK || 'https://pay.hotmart.com/W103146395W';
const GA_MEASUREMENT_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    }
});

// ========================================
// VALIDAÇÃO HMAC
// ========================================

function verifyHotmartSignature(body, signature) {
    const computedSignature = crypto
        .createHmac('sha256', HOTMART_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

    return computedSignature === signature;
}

// ========================================
// WEBHOOK HOTMART
// ========================================

app.post('/webhook/hotmart', async (req, res) => {
    try {
        console.log('[WEBHOOK] Recebido:', req.body);

        // Validar assinatura
        const signature = req.headers['x-hotmart-signature'];
        if (!verifyHotmartSignature(req.body, signature)) {
            console.error('[WEBHOOK] Assinatura inválida');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = req.body;

        // Processar eventos de compra
        if (event.type === 'PURCHASE_COMPLETE' || event.type === 'PURCHASE_APPROVED') {
            await processPurchase(event);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('[WEBHOOK] Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// PROCESSAR COMPRA
// ========================================

async function processPurchase(event) {
    try {
        const buyer = event.data.buyer;
        const purchase = event.data.purchase;

        console.log(`[COMPRA] ${buyer.email} - Produto: ${purchase.product_id}`);

        // 1. Salvar em log
        const fs = require('fs');
        const logEntry = {
            timestamp: new Date().toISOString(),
            buyer_email: buyer.email,
            buyer_name: buyer.name,
            purchase_id: purchase.id,
            amount: purchase.price,
            status: purchase.status
        };

        fs.appendFileSync(
            'logs/webhook-hotmart.log',
            JSON.stringify(logEntry) + '\n'
        );

        // 2. Enviar email
        await sendEbookEmail(buyer.email, buyer.name);

        // 3. Rastrear em GA4
        await trackConversionGA4(buyer.email, purchase.price);

        // 4. Rastrear em Facebook
        await trackConversionFacebook(buyer.email);

    } catch (error) {
        console.error('[PROCESSAR_COMPRA] Erro:', error);
    }
}

// ========================================
// ENVIAR EMAIL COM E-BOOK
// ========================================

async function sendEbookEmail(email, name) {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: '🎉 Seu E-book Reset Primal está pronto! - Link de acesso',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button {
                        background: #FF5722;
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        margin: 20px 0;
                    }
                    .footer { font-size: 12px; color: #999; text-align: center; padding: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Bem-vindo ao Reset Primal!</h1>
                    </div>
                    <div class="content">
                        <p>Oi ${name},</p>
                        <p>Sua compra foi confirmada com sucesso! 🚀</p>
                        <p>Seu e-book completo (72 capítulos) + bônus está pronto para download.</p>
                        <p><strong>Acesso às 3 fases do protocolo:</strong></p>
                        <ul>
                            <li>Depleção Estratégica (Dias 1-7)</li>
                            <li>Aceleração Lipídica (Dias 8-14)</li>
                            <li>Estabilização e Reversão (Dias 15-21)</li>
                        </ul>
                        <p><strong>Bônus inclusos:</strong></p>
                        <ul>
                            <li>47 Receitas Primal</li>
                            <li>Tracker de Progresso</li>
                            <li>Guia de Transição Metabólica</li>
                            <li>Protocolo de Sono</li>
                        </ul>
                        <center>
                            <a href="${process.env.EBOOK_DOWNLOAD_URL || 'https://resetprimal.com.br/ebook'}" class="button">
                                📥 BAIXAR MEU E-BOOK AGORA
                            </a>
                        </center>
                        <p style="margin-top: 30px; font-size: 14px;">
                            <strong>Comece hoje e em 21 dias você estará 7-11kg mais leve.</strong><br>
                            Qualquer dúvida, respondo em até 24h.
                        </p>
                        <p>Sucesso na sua transformação!<br>
                        <strong>Reset Primal™</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 Reset Primal™. Todos os direitos reservados.</p>
                        <p><a href="https://resetprimal.com.br/privacidade">Política de Privacidade</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Enviado para ${email}`);
    } catch (error) {
        console.error(`[EMAIL] Erro ao enviar para ${email}:`, error);
    }
}

// ========================================
// RASTREAR EM GA4
// ========================================

async function trackConversionGA4(email, value) {
    try {
        const response = await fetch('https://www.google-analytics.com/mp/collect', {
            method: 'POST',
            body: JSON.stringify({
                client_id: email, // Usar email como client_id
                user_id: email,
                events: [{
                    name: 'purchase',
                    params: {
                        value: value,
                        currency: 'BRL',
                        transaction_id: Date.now().toString()
                    }
                }]
            }),
            headers: { 'Content-Type': 'application/json' },
            qs: {
                measurement_id: GA_MEASUREMENT_ID,
                api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET
            }
        });

        console.log(`[GA4] Conversão rastreada para ${email}`);
    } catch (error) {
        console.error('[GA4] Erro:', error);
    }
}

// ========================================
// RASTREAR EM FACEBOOK
// ========================================

async function trackConversionFacebook(email) {
    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PIXEL_ID}/events`, {
            method: 'POST',
            body: JSON.stringify({
                data: [{
                    event_name: 'Purchase',
                    event_time: Math.floor(Date.now() / 1000),
                    user_data: {
                        em: crypto.createHash('sha256').update(email).digest('hex')
                    }
                }],
                access_token: process.env.FACEBOOK_PIXEL_TOKEN
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[FACEBOOK] Conversão rastreada para ${email}`);
    } catch (error) {
        console.error('[FACEBOOK] Erro:', error);
    }
}

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Webhook Hotmart rodando em http://localhost:${PORT}`);
});

module.exports = app;