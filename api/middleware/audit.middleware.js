/**
 * Audit Logging Middleware
 *
 * Logs all API requests and responses for security auditing:
 * - Request metadata (method, path, IP, user agent)
 * - Response status and timing
 * - Failed authentication attempts
 * - Suspicious activity detection
 */

const securityConfig = require('../../config/security');

// ============================================================================
// AUDIT MIDDLEWARE
// ============================================================================

/**
 * Middleware to audit all API requests
 * Logs: user ID, operation type, timestamp, IP address, response status
 */
function auditMiddleware(req, res, next) {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end to capture response
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const auditEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      user_id: req.user?.id,
      status_code: res.statusCode,
      duration_ms: duration,
      response_size: res.get('content-length') || 0,
    };

    // Log the request
    logAuditEvent(auditEntry);

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Middleware to detect and log failed authentication attempts
 */
function failedAuthAuditMiddleware(req, res, next) {
  // Check for failed login attempts
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 400) {
        logSecurityEvent('FAILED_LOGIN', {
          email: req.body?.email || 'unknown',
          ip_address: req.ip,
          timestamp: new Date().toISOString(),
          reason: res.statusCode === 401 ? 'Invalid credentials' : 'Bad request',
        });

        // Track failed attempts for brute force detection
        trackFailedLoginAttempt(req.ip, req.body?.email);
      }
    });
  }

  next();
}

/**
 * Middleware to detect privilege escalation attempts
 */
function privilegeEscalationAuditMiddleware(req, res, next) {
  // Check if user is attempting admin operations without admin role
  if (req.path.startsWith('/api/admin') && req.method !== 'GET') {
    if (req.user && !req.user.roles?.includes('admin')) {
      logSecurityEvent('PRIVILEGE_ESCALATION_ATTEMPT', {
        user_id: req.user.id,
        attempted_path: req.path,
        ip_address: req.ip,
        timestamp: new Date().toISOString(),
      });

      // Alert immediately for privilege escalation
      alertSecurityTeam('PRIVILEGE_ESCALATION_ATTEMPT', {
        user_id: req.user.id,
        path: req.path,
        severity: 'CRITICAL',
      });
    }
  }

  next();
}

/**
 * Middleware to detect bulk operations (delete/update > 1000 rows)
 */
function bulkOperationAuditMiddleware(req, res, next) {
  // Hook into response to check for bulk operations
  res.on('finish', () => {
    // This would be populated by the application layer
    if (req.bulkOperationRowCount && req.bulkOperationRowCount > 1000) {
      logSecurityEvent('BULK_OPERATION', {
        user_id: req.user?.id,
        operation: req.method,
        path: req.path,
        rows_affected: req.bulkOperationRowCount,
        ip_address: req.ip,
        timestamp: new Date().toISOString(),
      });

      // Alert security team
      alertSecurityTeam('BULK_OPERATION_DETECTED', {
        user_id: req.user?.id,
        rows: req.bulkOperationRowCount,
        severity: 'HIGH',
      });
    }
  });

  next();
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

/**
 * Log a security event to CloudWatch
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 */
function logSecurityEvent(eventType, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    severity: getSeverity(eventType),
    ...details,
  };

  // Log to CloudWatch
  console.log(
    JSON.stringify({
      level: 'SECURITY',
      message: `Security Event: ${eventType}`,
      ...logEntry,
    })
  );

  // Send to CloudWatch if configured
  if (process.env.NODE_ENV === 'production') {
    sendToCloudWatch(logEntry);
  }
}

/**
 * Log an audit event to database
 * @param {Object} entry - Audit entry
 */
function logAuditEvent(entry) {
  // Skip health check and metrics endpoints
  if (entry.path?.includes('/health') || entry.path?.includes('/metrics')) {
    return;
  }

  // Log to CloudWatch
  console.log(
    JSON.stringify({
      level: 'AUDIT',
      message: `${entry.method} ${entry.path} ${entry.status_code}`,
      ...entry,
    })
  );

  // In production, this would also be stored in the audit_logs table
  if (process.env.NODE_ENV === 'production') {
    // Queue for database logging (batch)
    queueAuditLog(entry);
  }
}

/**
 * Determine severity level for security event
 * @param {string} eventType - Event type
 * @returns {string} - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
 */
function getSeverity(eventType) {
  const severityMap = {
    PRIVILEGE_ESCALATION_ATTEMPT: 'CRITICAL',
    FAILED_LOGIN: 'HIGH',
    BULK_OPERATION: 'HIGH',
    BACKUP_FAILURE: 'CRITICAL',
    SQL_INJECTION_ATTEMPT: 'CRITICAL',
    UNAUTHORIZED_ACCESS: 'HIGH',
    DATA_EXPORT: 'MEDIUM',
    CONFIG_CHANGE: 'MEDIUM',
  };

  return severityMap[eventType] || 'LOW';
}

// ============================================================================
// FAILED LOGIN TRACKING (Brute Force Detection)
// ============================================================================

const failedAttempts = new Map();

/**
 * Track failed login attempts for brute force detection
 * @param {string} ip - IP address
 * @param {string} email - Email address
 */
function trackFailedLoginAttempt(ip, email) {
  const key = `${ip}:${email}`;
  const attempts = failedAttempts.get(key) || [];
  attempts.push(Date.now());

  // Keep only attempts from last 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentAttempts = attempts.filter((time) => time > fiveMinutesAgo);

  if (recentAttempts.length > 5) {
    // Alert on 6+ attempts in 5 minutes
    logSecurityEvent('BRUTE_FORCE_DETECTED', {
      ip_address: ip,
      email: email,
      attempts: recentAttempts.length,
      window_minutes: 5,
    });

    alertSecurityTeam('BRUTE_FORCE_DETECTED', {
      ip: ip,
      email: email,
      attempts: recentAttempts.length,
      severity: 'HIGH',
    });
  }

  failedAttempts.set(key, recentAttempts);
}

// ============================================================================
// ALERT FUNCTIONS
// ============================================================================

/**
 * Alert security team of critical security event
 * @param {string} eventType - Event type
 * @param {Object} details - Event details
 */
function alertSecurityTeam(eventType, details) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  console.error(
    JSON.stringify({
      alert: true,
      event_type: eventType,
      severity: details.severity || 'HIGH',
      timestamp: new Date().toISOString(),
      ...details,
    })
  );

  // In production, this would send to Slack, PagerDuty, etc.
  // sendToSlack(`🚨 ${eventType}: ${JSON.stringify(details)}`);
}

// ============================================================================
// CLOUDWATCH INTEGRATION
// ============================================================================

/**
 * Send event to CloudWatch
 * @param {Object} logEntry - Log entry
 */
function sendToCloudWatch(logEntry) {
  // This would use AWS SDK to put metrics
  // Implementation depends on CloudWatch setup
  try {
    console.log('📊 Sending to CloudWatch:', logEntry.event_type);
  } catch (error) {
    console.error('Failed to send to CloudWatch:', error.message);
  }
}

// ============================================================================
// AUDIT LOG QUEUING (Batch Processing)
// ============================================================================

const auditQueue = [];
let auditFlushTimer;

/**
 * Queue an audit log entry for batch processing
 * @param {Object} entry - Audit entry
 */
function queueAuditLog(entry) {
  auditQueue.push(entry);

  // Flush if batch size reached
  if (auditQueue.length >= securityConfig.auditConfig.batchSize) {
    flushAuditLogs();
  } else if (!auditFlushTimer) {
    // Or schedule flush every N milliseconds
    auditFlushTimer = setTimeout(() => {
      flushAuditLogs();
    }, securityConfig.auditConfig.flushIntervalMs);
  }
}

/**
 * Flush queued audit logs to database
 */
async function flushAuditLogs() {
  if (auditQueue.length === 0) {
    return;
  }

  const logsToFlush = [...auditQueue];
  auditQueue.length = 0;

  if (auditFlushTimer) {
    clearTimeout(auditFlushTimer);
    auditFlushTimer = null;
  }

  try {
    // Batch insert to audit_logs table
    // This would be implemented with actual database connection
    console.log(`📝 Flushed ${logsToFlush.length} audit logs`);
  } catch (error) {
    console.error('Failed to flush audit logs:', error.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  auditMiddleware,
  failedAuthAuditMiddleware,
  privilegeEscalationAuditMiddleware,
  bulkOperationAuditMiddleware,
  logSecurityEvent,
  logAuditEvent,
  alertSecurityTeam,
  flushAuditLogs,
};
