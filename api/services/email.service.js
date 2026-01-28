const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  /**
   * Send e-book welcome email after purchase
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.userName - Recipient name
   * @param {string} params.transactionId - Hotmart transaction ID
   * @returns {Promise<void>}
   */
  async sendEbookWelcomeEmail({ toEmail, userName, transactionId }) {
    try {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: '🎉 Seu E-book Reset Primal está pronto!',
        html: `
          <h2>Bem-vindo ao Reset Primal!</h2>
          <p>Olá ${userName || 'Visitante'},</p>
          <p>Obrigado pela compra! Seu e-book completo está pronto para download.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.EBOOK_DOWNLOAD_URL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📥 Baixar E-book
            </a>
          </p>
          <hr style="margin-top: 30px; margin-bottom: 30px;">
          <p><small>Transação: ${transactionId}</small></p>
          <p><small>Se tiver dúvidas, entre em contato conosco.</small></p>
        `
      };

      await sgMail.send(msg);
      logger.info(`[EMAIL] E-book welcome email sent to ${toEmail}`);
    } catch (error) {
      logger.error(`[EMAIL] Failed to send e-book welcome email to ${toEmail}`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.userName - Recipient name
   * @param {string} params.resetLink - Password reset link
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail({ toEmail, userName, resetLink }) {
    try {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Redefinir sua senha - Reset Primal',
        html: `
          <h2>Redefinição de Senha</h2>
          <p>Olá ${userName || 'Usuário'},</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar:</p>
          <p style="margin-top: 30px;">
            <a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🔑 Redefinir Senha
            </a>
          </p>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Este link expira em 1 hora.</p>
          <p style="margin-top: 30px; color: #999; font-size: 11px;">Se você não solicitou uma redefinição de senha, ignore este email.</p>
        `
      };

      await sgMail.send(msg);
      logger.info(`[EMAIL] Password reset email sent to ${toEmail}`);
    } catch (error) {
      logger.error(`[EMAIL] Failed to send password reset email to ${toEmail}`, error);
      throw error;
    }
  }

  /**
   * Send confirmation email for email verification
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.userName - Recipient name
   * @param {string} params.verificationLink - Email verification link
   * @returns {Promise<void>}
   */
  async sendEmailVerificationEmail({ toEmail, userName, verificationLink }) {
    try {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Confirme seu Email - Reset Primal',
        html: `
          <h2>Confirmação de Email</h2>
          <p>Olá ${userName || 'Usuário'},</p>
          <p>Para completar seu cadastro, clique no link abaixo para confirmar seu email:</p>
          <p style="margin-top: 30px;">
            <a href="${verificationLink}" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ✓ Confirmar Email
            </a>
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 11px;">Este link expira em 24 horas.</p>
        `
      };

      await sgMail.send(msg);
      logger.info(`[EMAIL] Email verification email sent to ${toEmail}`);
    } catch (error) {
      logger.error(`[EMAIL] Failed to send email verification email to ${toEmail}`, error);
      throw error;
    }
  }
}

module.exports = new EmailService();
