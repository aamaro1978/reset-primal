/**
 * DigitalOcean Alerting Configuration
 * 
 * SendGrid-based email alerts for critical events
 * Replaces AWS SNS
 */

const nodemailer = require('nodemailer');

/**
 * SendGrid transporter configuration
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
};

/**
 * Alert severity levels
 */
const AlertSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Alert configuration
 */
const alertConfig = {
  // Sender email
  fromEmail: process.env.ALERT_FROM_EMAIL || 'noreply@reset-primal.com',
  fromName: 'Reset Primal Alerts',

  // Recipients by severity
  recipients: {
    [AlertSeverity.CRITICAL]: (process.env.ALERT_RECIPIENTS_CRITICAL || '').split(',').filter(Boolean),
    [AlertSeverity.HIGH]: (process.env.ALERT_RECIPIENTS_HIGH || '').split(',').filter(Boolean),
    [AlertSeverity.MEDIUM]: (process.env.ALERT_RECIPIENTS_MEDIUM || '').split(',').filter(Boolean),
    [AlertSeverity.LOW]: (process.env.ALERT_RECIPIENTS_LOW || '').split(',').filter(Boolean),
  },

  // Alert templates
  templates: {
    database: {
      subject: '[{severity}] Database Alert: {name}',
      body: `
Alert Type: Database
Severity: {severity}
Time: {timestamp}

Alert: {name}
Description: {description}

Details:
{details}

---
Reset Primal Monitoring System
      `
    },
    application: {
      subject: '[{severity}] Application Alert: {name}',
      body: `
Alert Type: Application
Severity: {severity}
Time: {timestamp}

Alert: {name}
Description: {description}

Metrics:
{details}

---
Reset Primal Monitoring System
      `
    },
    backup: {
      subject: '[{severity}] Backup Alert: {name}',
      body: `
Alert Type: Backup
Severity: {severity}
Time: {timestamp}

Status: {name}
Description: {description}

Details:
{details}

---
Reset Primal Monitoring System
      `
    },
  },

  // Alert debouncing (don't send same alert more than once per hour)
  debounceMinutes: 60,
};

/**
 * Send alert email
 */
async function sendAlert(alertType, severity, name, description, details = {}) {
  try {
    // Validate inputs
    if (!Object.values(AlertSeverity).includes(severity)) {
      throw new Error(`Invalid severity: ${severity}`);
    }

    // Get recipients for this severity
    const recipients = alertConfig.recipients[severity] || [];
    if (recipients.length === 0) {
      console.warn(`No recipients configured for severity: ${severity}`);
      return false;
    }

    // Get template
    const template = alertConfig.templates[alertType];
    if (!template) {
      throw new Error(`No template for alert type: ${alertType}`);
    }

    // Format message
    const timestamp = new Date().toISOString();
    const subject = template.subject
      .replace('{severity}', severity.toUpperCase())
      .replace('{name}', name);

    const detailsText = Object.entries(details)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');

    const body = template.body
      .replace('{severity}', severity.toUpperCase())
      .replace('{timestamp}', timestamp)
      .replace('{name}', name)
      .replace('{description}', description)
      .replace('{details}', detailsText);

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `${alertConfig.fromName} <${alertConfig.fromEmail}>`,
      to: recipients.join(','),
      subject: subject,
      text: body,
      replyTo: process.env.ALERT_REPLY_TO || alertConfig.fromEmail,
    });

    console.log(`[ALERT] Sent ${severity} alert: ${name}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to send alert: ${error.message}`);
    return false;
  }
}

/**
 * Alert database events
 */
async function alertDatabaseEvent(name, description, details = {}) {
  return sendAlert('database', AlertSeverity.CRITICAL, name, description, details);
}

/**
 * Alert application events
 */
async function alertApplicationEvent(severity, name, description, details = {}) {
  return sendAlert('application', severity, name, description, details);
}

/**
 * Alert backup events
 */
async function alertBackupEvent(severity, name, description, details = {}) {
  return sendAlert('backup', severity, name, description, details);
}

/**
 * Alert health check failures
 */
async function alertHealthCheckFailure(component, reason, details = {}) {
  const description = `${component} health check failed: ${reason}`;
  return sendAlert('application', AlertSeverity.HIGH, `${component} Down`, description, details);
}

/**
 * Validate SendGrid configuration
 */
function validateConfiguration() {
  const errors = [];

  if (!process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY environment variable is required');
  }

  if (!process.env.ALERT_RECIPIENTS_CRITICAL || 
      process.env.ALERT_RECIPIENTS_CRITICAL.trim().length === 0) {
    errors.push('ALERT_RECIPIENTS_CRITICAL environment variable is required');
  }

  if (errors.length > 0) {
    console.error('Alert configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    return false;
  }

  return true;
}

module.exports = {
  AlertSeverity,
  alertConfig,
  sendAlert,
  alertDatabaseEvent,
  alertApplicationEvent,
  alertBackupEvent,
  alertHealthCheckFailure,
  validateConfiguration,
  createTransporter,
};
