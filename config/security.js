/**
 * Reset Primal: Security Configuration
 *
 * Centralized security settings for production environment:
 * - Role-based access control (RBAC) configuration
 * - Encryption settings (at-rest, in-transit)
 * - Secrets management (AWS Secrets Manager)
 * - Audit logging configuration
 * - Security monitoring and alerting
 */

const AWS = require('aws-sdk');

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

const rbacConfig = {
  // Application user - Limited write access
  app_user: {
    name: 'reset_primal_app',
    permissions: {
      users: ['SELECT', 'INSERT', 'UPDATE'],
      purchases: ['SELECT', 'INSERT', 'UPDATE'],
      products: ['SELECT', 'INSERT', 'UPDATE'],
      audit_logs: [],  // Explicitly denied
    },
    connectionLimit: 20,
    statementTimeout: 30000,  // 30 seconds
  },

  // Reporting user - Read-only access
  reporting_user: {
    name: 'reset_primal_reporting',
    permissions: {
      users: ['SELECT'],
      purchases: ['SELECT'],
      products: ['SELECT'],
      audit_logs: ['SELECT'],
    },
    connectionLimit: 20,
    statementTimeout: 60000,  // 60 seconds
  },

  // Admin user - Full access (requires MFA)
  admin_user: {
    name: 'reset_primal_admin',
    permissions: {
      '*': ['*'],  // Full access
    },
    connectionLimit: 10,
    requiresMFA: true,
    auditLog: true,
  },
};

// ============================================================================
// ENCRYPTION CONFIGURATION
// ============================================================================

const encryptionConfig = {
  // At-rest encryption
  atRest: {
    enabled: true,
    algorithm: 'AES-256',
    provider: 'AWS KMS',
    keyRotationEnabled: true,
    keyRotationPeriodDays: 90,
  },

  // In-transit encryption
  inTransit: {
    enabled: true,
    tlsVersion: 'TLS1.2',
    cipherSuites: [
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
    ],
    hstsEnabled: true,
    hstsMaxAge: 31536000,  // 1 year
  },

  // Column-level encryption for sensitive data
  columnEncryption: {
    enabled: true,
    sensitiveFields: [
      'email',      // User email addresses
      'phone',      // Phone numbers
      'ssn',        // Social Security Numbers (if stored)
    ],
    algorithm: 'AES-256-GCM',
  },

  // Backup encryption
  backupEncryption: {
    enabled: true,
    algorithm: 'AES-256',
    provider: 'AWS KMS',
    storageClass: 'STANDARD_IA',  // Infrequent Access for cost savings
  },
};

// ============================================================================
// SECRETS MANAGEMENT (AWS Secrets Manager)
// ============================================================================

const secretsConfig = {
  enabled: true,
  provider: 'AWS Secrets Manager',
  region: process.env.AWS_REGION || 'us-east-1',

  secrets: {
    // Database credentials
    database_password: {
      name: 'reset-primal-prod/database/app-user',
      rotationEnabled: true,
      rotationPeriodDays: 90,
      rotationFunction: 'arn:aws:lambda:us-east-1:ACCOUNT_ID:function:rotate-db-secret',
    },

    admin_password: {
      name: 'reset-primal-prod/database/admin-user',
      rotationEnabled: true,
      rotationPeriodDays: 90,
    },

    // API keys
    hotmart_webhook_secret: {
      name: 'reset-primal-prod/api/hotmart-webhook',
      rotationEnabled: false,
      rotationPeriodDays: 180,
    },

    sendgrid_api_key: {
      name: 'reset-primal-prod/api/sendgrid',
      rotationEnabled: false,
      rotationPeriodDays: 180,
    },

    ga4_api_secret: {
      name: 'reset-primal-prod/api/ga4',
      rotationEnabled: false,
      rotationPeriodDays: 180,
    },

    // JWT secrets
    jwt_secret: {
      name: 'reset-primal-prod/auth/jwt-secret',
      rotationEnabled: true,
      rotationPeriodDays: 180,
    },

    // SSL certificates (if stored)
    ssl_certificate: {
      name: 'reset-primal-prod/ssl/certificate',
      rotationEnabled: false,
    },
  },

  // IAM role for secrets access
  iamRole: {
    name: 'ResetPrimalAppSecretsAccess',
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          Resource: [
            'arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:reset-primal-prod/*',
          ],
        },
      ],
    },
  },
};

// ============================================================================
// AUDIT LOGGING CONFIGURATION
// ============================================================================

const auditConfig = {
  enabled: true,
  table: 'audit_logs',
  retention: {
    days: 365,
    archiveAfterDays: 30,
    archiveDestination: 's3://reset-primal-backups-prod/audit-logs/',
  },

  // Events to audit
  auditedOperations: {
    users: ['INSERT', 'UPDATE', 'DELETE'],
    purchases: ['INSERT', 'UPDATE', 'DELETE'],
    products: ['INSERT', 'UPDATE', 'DELETE'],
    audit_logs: [],  // Don't audit the audit table
  },

  // Performance settings
  batchSize: 100,
  flushIntervalMs: 5000,  // Flush every 5 seconds
  maxLatencyMs: 10,  // Max 10ms latency for audit logging

  // Sensitive data masking
  maskFields: [
    'password_hash',
    'api_key',
    'secret',
    'token',
  ],

  // Log verbosity
  logFullQueryText: false,  // Don't log full query for privacy
  logConnectionInfo: true,
  logDuration: true,
};

// ============================================================================
// SECURITY MONITORING & ALERTING
// ============================================================================

const monitoringConfig = {
  cloudwatch: {
    namespace: 'ResetPrimal/Security',
    enabled: true,

    // Security event alarms
    alarms: {
      failedAuthentication: {
        metricName: 'FailedLoginAttempts',
        threshold: 5,
        evaluationPeriods: 1,
        periodSeconds: 300,  // 5 minutes
        statistic: 'Sum',
        alertAction: 'SNS',
      },

      privilegeEscalation: {
        metricName: 'PrivilegeEscalationAttempts',
        threshold: 1,
        evaluationPeriods: 1,
        periodSeconds: 300,
        statistic: 'Sum',
        alertAction: 'SNS',
        severity: 'CRITICAL',
      },

      bulkDelete: {
        metricName: 'BulkDeleteOperations',
        threshold: 1000,  // > 1000 rows in single operation
        evaluationPeriods: 1,
        periodSeconds: 300,
        statistic: 'Sum',
        alertAction: 'SNS',
        severity: 'HIGH',
      },

      backupFailure: {
        metricName: 'BackupFailures',
        threshold: 0,
        evaluationPeriods: 1,
        periodSeconds: 3600,  // 1 hour
        statistic: 'Sum',
        alertAction: 'SNS',
        severity: 'CRITICAL',
      },

      unusualActivity: {
        metricName: 'UnusualActivityDetected',
        threshold: 0,
        evaluationPeriods: 1,
        periodSeconds: 300,
        statistic: 'Sum',
        alertAction: 'SNS',
        severity: 'HIGH',
      },
    },

    // Log insights queries
    logInsights: {
      securityEventQuery: `
        fields @timestamp, @message, user_id, operation, table_name
        | filter @message like /ERROR|WARN|SECURITY/
        | stats count() as event_count by user_id, operation
        | sort event_count desc
      `,

      failedLoginQuery: `
        fields @timestamp, user_email, ip_address, error_message
        | filter @message like /failed.*login|authentication.*failed/
        | stats count() as attempt_count by user_email, ip_address
        | filter attempt_count > 3
      `,

      adminActionQuery: `
        fields @timestamp, admin_user, action, affected_resource
        | filter @message like /admin|elevated|superuser/
        | stats count() as action_count by admin_user, action
      `,
    },
  },

  // Daily security audit report
  dailyReport: {
    enabled: true,
    scheduleTime: '00:00 UTC',
    recipients: ['security@reset-primal.com'],
    sections: [
      'authentication_summary',
      'admin_actions',
      'failed_operations',
      'audit_log_volume',
      'security_alerts',
      'recommendations',
    ],
  },
};

// ============================================================================
// SECURITY INCIDENT RESPONSE
// ============================================================================

const incidentResponseConfig = {
  enabled: true,

  // Incident severity levels
  severityLevels: {
    CRITICAL: {
      responseTime: '15 minutes',
      escalation: 'CEO, Security Lead, DevOps',
      actions: ['ISOLATE', 'NOTIFY_CUSTOMERS', 'PUBLIC_STATEMENT'],
    },
    HIGH: {
      responseTime: '1 hour',
      escalation: 'Security Lead, DevOps',
      actions: ['INVESTIGATE', 'PATCH', 'MONITOR'],
    },
    MEDIUM: {
      responseTime: '4 hours',
      escalation: 'DevOps',
      actions: ['INVESTIGATE', 'FIX', 'DOCUMENT'],
    },
    LOW: {
      responseTime: '24 hours',
      escalation: 'None',
      actions: ['DOCUMENT', 'FIX_IN_NEXT_RELEASE'],
    },
  },

  // Incident channels
  channels: {
    slack: '#security-incidents',
    pagerduty: true,
    email: 'security@reset-primal.com',
  },
};

// ============================================================================
// COMPLIANCE CONFIGURATION
// ============================================================================

const complianceConfig = {
  lgpd: {
    enabled: true,  // Brazilian data protection law
    dataRetention: 365,  // Days to retain personal data
    consentRequired: true,
    rightToDelete: true,
    dataPortability: true,
  },

  gdpr: {
    enabled: false,  // EU data protection (if applicable)
    dataRetention: 365,
  },

  hipaa: {
    enabled: false,  // Healthcare data (if applicable)
    encryptionRequired: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get secret value from AWS Secrets Manager
 * @param {string} secretName - Name of the secret
 * @returns {Promise<string>} - Secret value
 */
async function getSecret(secretName) {
  const secretsManager = new AWS.SecretsManager({
    region: secretsConfig.region,
  });

  try {
    const response = await secretsManager.getSecretValue({
      SecretId: secretName,
    }).promise();

    if (response.SecretString) {
      return response.SecretString;
    }
    return Buffer.from(response.SecretBinary, 'base64').toString('ascii');
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

/**
 * Validate security configuration on startup
 * @returns {Promise<boolean>} - True if all checks pass
 */
async function validateSecurityConfig() {
  console.log('🔒 Validating security configuration...');

  const checks = [
    { name: 'RBAC enabled', check: rbacConfig.app_user !== undefined },
    { name: 'Encryption enabled', check: encryptionConfig.atRest.enabled },
    { name: 'Secrets Manager configured', check: secretsConfig.enabled },
    { name: 'Audit logging enabled', check: auditConfig.enabled },
    { name: 'Monitoring enabled', check: monitoringConfig.cloudwatch.enabled },
    { name: 'TLS 1.2+ required', check: encryptionConfig.inTransit.tlsVersion === 'TLS1.2' },
  ];

  let allPassed = true;
  checks.forEach(({ name, check }) => {
    const status = check ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
    if (!check) allPassed = false;
  });

  return allPassed;
}

/**
 * Load secrets at application startup
 * @returns {Promise<Object>} - Object containing all secrets
 */
async function loadSecrets() {
  const secrets = {};

  for (const [key, config] of Object.entries(secretsConfig.secrets)) {
    try {
      secrets[key] = await getSecret(config.name);
    } catch (error) {
      console.error(`Failed to load secret: ${key}`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;  // Fatal in production
      }
    }
  }

  return secrets;
}

/**
 * Mask sensitive values in logs
 * @param {Object} data - Data object to mask
 * @returns {Object} - Masked object
 */
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const masked = { ...data };
  auditConfig.maskFields.forEach((field) => {
    if (field in masked) {
      masked[field] = '[MASKED]';
    }
  });

  return masked;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  rbacConfig,
  encryptionConfig,
  secretsConfig,
  auditConfig,
  monitoringConfig,
  incidentResponseConfig,
  complianceConfig,
  getSecret,
  validateSecurityConfig,
  loadSecrets,
  maskSensitiveData,
};
