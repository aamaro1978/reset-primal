/**
 * Monitoring Configuration - Reset Primal
 *
 * CloudWatch metrics, alarms, and APM configuration
 */

const AWS = require('aws-sdk');

const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Custom metrics configuration
 */
const customMetrics = {
  // Application metrics
  application: {
    ResponseTimeP50: {
      namespace: 'reset-primal/app',
      unit: 'Milliseconds',
      description: 'API response time p50'
    },
    ResponseTimeP95: {
      namespace: 'reset-primal/app',
      unit: 'Milliseconds',
      description: 'API response time p95'
    },
    ResponseTimeP99: {
      namespace: 'reset-primal/app',
      unit: 'Milliseconds',
      description: 'API response time p99'
    },
    ErrorRate: {
      namespace: 'reset-primal/app',
      unit: 'Percent',
      description: 'Application error rate (%)'
    },
    ThroughputPerSecond: {
      namespace: 'reset-primal/app',
      unit: 'Count/Second',
      description: 'Requests per second'
    },
    RequestCount: {
      namespace: 'reset-primal/app',
      unit: 'Count',
      description: 'Total request count'
    }
  },

  // Database metrics
  database: {
    QueryCountPerSecond: {
      namespace: 'reset-primal/db',
      unit: 'Count/Second',
      description: 'Database queries per second'
    },
    SlowQueryCount: {
      namespace: 'reset-primal/db',
      unit: 'Count',
      description: 'Number of slow queries (> 100ms)'
    },
    ConnectionPoolUtilization: {
      namespace: 'reset-primal/db',
      unit: 'Percent',
      description: 'Connection pool utilization %'
    },
    ReplicationLagSeconds: {
      namespace: 'reset-primal/db',
      unit: 'Seconds',
      description: 'Database replication lag'
    }
  },

  // Business metrics
  business: {
    PurchasesPerHour: {
      namespace: 'reset-primal/business',
      unit: 'Count',
      description: 'Purchases processed in last hour'
    },
    RevenuePerDay: {
      namespace: 'reset-primal/business',
      unit: 'None',
      description: 'Daily revenue'
    },
    ActiveUsersOnline: {
      namespace: 'reset-primal/business',
      unit: 'Count',
      description: 'Currently active users'
    }
  },

  // Webhook metrics
  webhook: {
    ProcessingRate: {
      namespace: 'reset-primal/webhook',
      unit: 'Count/Second',
      description: 'Webhooks processed per second'
    },
    FailureRate: {
      namespace: 'reset-primal/webhook',
      unit: 'Percent',
      description: 'Webhook failure rate (%)'
    },
    QueueDepth: {
      namespace: 'reset-primal/webhook',
      unit: 'Count',
      description: 'Pending webhooks in queue'
    }
  },

  // Email metrics
  email: {
    DeliveryRate: {
      namespace: 'reset-primal/email',
      unit: 'Percent',
      description: 'Email delivery success rate (%)'
    },
    FailureRate: {
      namespace: 'reset-primal/email',
      unit: 'Percent',
      description: 'Email delivery failure rate (%)'
    },
    ProcessingTime: {
      namespace: 'reset-primal/email',
      unit: 'Milliseconds',
      description: 'Email processing time'
    }
  },

  // Backup metrics
  backup: {
    BackupStatus: {
      namespace: 'reset-primal/backup',
      unit: 'None',
      description: 'Backup success (1=success, 0=failed)'
    },
    BackupAgeHours: {
      namespace: 'reset-primal/backup',
      unit: 'Hours',
      description: 'Hours since last successful backup'
    },
    BackupSizeGB: {
      namespace: 'reset-primal/backup',
      unit: 'Gigabytes',
      description: 'Size of latest backup'
    }
  }
};

/**
 * Publish a custom metric to CloudWatch
 */
const publishMetric = async (namespace, metricName, value, unit = 'None', dimensions = {}) => {
  try {
    const params = {
      Namespace: namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: Object.entries(dimensions).map(([name, value]) => ({
            Name: name,
            Value: String(value)
          }))
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error(`Failed to publish metric ${namespace}/${metricName}:`, error);
  }
};

/**
 * Batch publish metrics
 */
const publishMetrics = async (namespace, metrics) => {
  try {
    const metricData = metrics.map(({ name, value, unit = 'None', dimensions = {} }) => ({
      MetricName: name,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: Object.entries(dimensions).map(([name, value]) => ({
        Name: name,
        Value: String(value)
      }))
    }));

    // CloudWatch has a limit of 20 metrics per request
    for (let i = 0; i < metricData.length; i += 20) {
      const batch = metricData.slice(i, i + 20);
      await cloudwatch.putMetricData({
        Namespace: namespace,
        MetricData: batch
      }).promise();
    }
  } catch (error) {
    console.error(`Failed to publish batch metrics to ${namespace}:`, error);
  }
};

/**
 * APM Configuration for X-Ray or similar
 */
const apmConfig = {
  enabled: process.env.APM_ENABLED === 'true',
  serviceName: 'reset-primal-api',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: process.env.APM_SAMPLE_RATE || 0.1,

  // Sampling rules
  sampling: {
    default: 0.1,
    database: 0.5,  // Sample more database traces
    webhook: 0.2,
    external_api: 0.1
  },

  // Performance baselines for alerting
  baselines: {
    api_response_time_p95: 500,  // milliseconds
    database_query_time_p95: 100,  // milliseconds
    webhook_processing: 5000,  // milliseconds
    email_delivery: 10000  // milliseconds
  },

  // Metric collection intervals
  intervals: {
    application: 60,  // seconds
    database: 30,  // seconds
    custom: 300  // seconds
  }
};

/**
 * Health check metrics schema
 */
const healthCheckSchema = {
  status: {
    type: 'enum',
    values: ['healthy', 'degraded', 'unhealthy']
  },
  timestamp: {
    type: 'string',
    format: 'ISO8601'
  },
  components: {
    database: {
      status: 'enum',
      latency_ms: 'number'
    },
    email: {
      status: 'enum',
      latency_ms: 'number'
    },
    ga4: {
      status: 'enum',
      latency_ms: 'number'
    },
    webhook: {
      status: 'enum',
      processed: 'number'
    },
    cache: {
      status: 'enum',
      hit_rate: 'number'
    }
  }
};

/**
 * Create metric filter for CloudWatch Logs
 */
const createMetricFilter = async (logGroupName, filterName, filterPattern, metricName, metricNamespace) => {
  const logs = new AWS.CloudWatchLogs({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  try {
    await logs.putMetricFilter({
      logGroupName,
      filterName,
      filterPattern,
      metricTransformations: [
        {
          metricName,
          metricNamespace,
          metricValue: '1',
          defaultValue: 0
        }
      ]
    }).promise();

    console.log(`Created metric filter: ${filterName} → ${metricNamespace}/${metricName}`);
  } catch (error) {
    console.error(`Failed to create metric filter ${filterName}:`, error);
  }
};

/**
 * Alert configuration
 */
const alertConfig = {
  sns_topic_ops: process.env.SNS_TOPIC_OPS || 'arn:aws:sns:us-east-1:123456789:ops-team',
  sns_topic_critical: process.env.SNS_TOPIC_CRITICAL || 'arn:aws:sns:us-east-1:123456789:ops-critical',
  pagerduty_webhook: process.env.PAGERDUTY_WEBHOOK,
  slack_webhook: process.env.SLACK_WEBHOOK,

  // Alert fatigue prevention
  minEvaluationPeriods: {
    critical: 1,  // 1 period = immediate
    high: 2,      // 2 periods = wait
    medium: 3     // 3 periods = wait
  }
};

module.exports = {
  customMetrics,
  publishMetric,
  publishMetrics,
  apmConfig,
  healthCheckSchema,
  createMetricFilter,
  alertConfig,
  cloudwatch
};
