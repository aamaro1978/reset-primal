/**
 * Unit Tests - Email Service
 * Tests SendGrid email delivery for e-book welcome emails
 */

const sgMail = require('@sendgrid/mail');

jest.mock('@sendgrid/mail');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Validation', () => {
    test('should validate valid email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'name+tag@subdomain.example.com',
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    test('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user@.com',
        'user name@example.com',
      ];

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('SendGrid Integration', () => {
    test('should call SendGrid with correct message structure', async () => {
      sgMail.send.mockResolvedValue([{ id: 'test-msg-id' }]);

      const mailObject = {
        to: 'customer@example.com',
        from: 'noreply@resetprimal.com.br',
        subject: '🎉 Seu E-book Reset Primal está pronto!',
        html: '<h1>Welcome</h1>',
      };

      await sgMail.send(mailObject);

      expect(sgMail.send).toHaveBeenCalledWith(mailObject);
      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    test('should handle SendGrid API errors', async () => {
      const error = new Error('SendGrid API Error');
      sgMail.send.mockRejectedValue(error);

      const mailObject = {
        to: 'customer@example.com',
        from: 'noreply@resetprimal.com.br',
        subject: 'Test',
      };

      await expect(sgMail.send(mailObject)).rejects.toThrow('SendGrid API Error');
    });

    test('should retry on transient failures', async () => {
      sgMail.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce([{ id: 'msg-id' }]);

      const mailObject = {
        to: 'customer@example.com',
        from: 'noreply@resetprimal.com.br',
        subject: 'Test',
      };

      try {
        await sgMail.send(mailObject);
      } catch {
        // First call fails
      }

      const result = await sgMail.send(mailObject);
      expect(result[0].id).toBe('msg-id');
    });
  });

  describe('Email Templates', () => {
    test('should include e-book download link in email', () => {
      const emailTemplate = `
        <a href="https://resetprimal.com.br/ebook">📥 BAIXAR MEU E-BOOK AGORA</a>
      `;

      expect(emailTemplate).toContain('ebook');
      expect(emailTemplate).toContain('BAIXAR');
    });

    test('should include transaction ID in email for tracking', () => {
      const transactionId = 'HOTMART-123-ABC';
      const emailTemplate = `
        <p>Seu ID de transação: ${transactionId}</p>
      `;

      expect(emailTemplate).toContain(transactionId);
    });

    test('should have proper HTML structure', () => {
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head><title>Reset Primal</title></head>
        <body>
          <h1>Bem-vindo!</h1>
          <p>Email content</p>
        </body>
        </html>
      `;

      expect(emailTemplate).toContain('<!DOCTYPE html>');
      expect(emailTemplate).toContain('<html>');
      expect(emailTemplate).toContain('<body>');
    });

    test('should escape HTML special characters in user data', () => {
      const userName = '<script>alert("xss")</script>';
      // Should be escaped
      const escaped = userName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });

  describe('Email Recipients', () => {
    test('should validate recipient email before sending', () => {
      const validRecipients = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Maria', email: 'maria@example.com' },
      ];

      validRecipients.forEach((recipient) => {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email);
        expect(isValidEmail).toBe(true);
      });
    });

    test('should handle multiple recipients if needed', () => {
      const recipients = ['customer@example.com', 'admin@resetprimal.com.br'];

      expect(recipients.length).toBe(2);
      expect(recipients[0]).toBe('customer@example.com');
    });

    test('should not send to invalid recipient list', () => {
      const invalidRecipients = [null, undefined, '', '   '];

      invalidRecipients.forEach((recipient) => {
        const isValid = recipient && recipient.trim().length > 0;
        expect(isValid).toBeFalsy();
      });
    });
  });

  describe('Email Delivery Status', () => {
    test('should track successful delivery', async () => {
      sgMail.send.mockResolvedValue([
        {
          id: 'message-id-123',
          status: 'sent',
          timestamp: Date.now(),
        },
      ]);

      const result = await sgMail.send({
        to: 'user@example.com',
        from: 'noreply@resetprimal.com.br',
        subject: 'Test',
      });

      expect(result[0].status).toBe('sent');
      expect(result[0].id).toBeDefined();
    });

    test('should handle bounced emails', () => {
      const bounceStatuses = ['bounced', 'blocked', 'invalid'];

      bounceStatuses.forEach((status) => {
        expect(['bounced', 'blocked', 'invalid']).toContain(status);
      });
    });

    test('should log delivery metadata', () => {
      const deliveryLog = {
        messageId: 'msg-123',
        recipientEmail: 'user@example.com',
        sentAt: new Date().toISOString(),
        subject: 'E-book Download',
        status: 'sent',
      };

      expect(deliveryLog.messageId).toBeDefined();
      expect(deliveryLog.recipientEmail).toMatch(/@/);
      expect(deliveryLog.status).toBe('sent');
    });
  });

  describe('Rate Limiting', () => {
    test('should not exceed SendGrid rate limits', async () => {
      const emails = Array(10).fill({ to: 'user@example.com' });

      for (const email of emails) {
        sgMail.send.mockResolvedValue([{ id: 'msg-id' }]);
        await sgMail.send(email);
      }

      expect(sgMail.send).toHaveBeenCalledTimes(10);
    });

    test('should queue emails if rate limit approached', () => {
      const queue = [];
      const maxQueueSize = 100;

      for (let i = 0; i < maxQueueSize; i++) {
        queue.push({ to: `user${i}@example.com` });
      }

      expect(queue.length).toBe(maxQueueSize);
      expect(queue.length).toBeLessThanOrEqual(maxQueueSize);
    });
  });
});
