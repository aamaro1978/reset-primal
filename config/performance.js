/**
 * Performance Configuration - Reset Primal
 *
 * Performance targets, baselines, and tuning parameters
 */

/**
 * Performance targets
 */
const performanceTargets = {
  // API response times
  api: {
    p50: 50,        // milliseconds
    p95: 100,       // milliseconds (normal load)
    p99: 500,       // milliseconds
    peak_p95: 500   // milliseconds (peak load)
  },

  // Database query times
  database: {
    p50: 20,        // milliseconds
    p95: 100,       // milliseconds
    p99: 500        // milliseconds
  },

  // Specific endpoints
  endpoints: {
    '/api/users': {
      p95: 100
    },
    '/api/products': {
      p95: 150
    },
    '/api/purchases': {
      p95: 200
    },
    '/api/transactions': {
      p95: 150
    }
  },

  // Webhook processing
  webhook: {
    maxProcessingTime: 5000,        // milliseconds
    targetThroughput: 100           // webhooks/second
  },

  // Email delivery
  email: {
    maxProcessingTime: 10000,       // milliseconds
    targetSuccessRate: 99           // percent
  }
};

/**
 * Load testing scenarios
 */
const loadTestScenarios = {
  // Scenario 1: Normal load (business hours)
  normal: {
    duration: '5m',
    stages: [
      { duration: '1m', target: 10 },   // Ramp up to 10 users
      { duration: '3m', target: 10 },   // Stay at 10 users
      { duration: '1m', target: 0 }     // Ramp down
    ],
    thresholds: {
      'http_req_duration{staticAsset:no}': ['p(95)<100', 'p(99)<500'],
      'http_req_failed': ['rate<0.01'],
      'http_requests': ['rate>50']
    }
  },

  // Scenario 2: Peak load (sales event)
  peak: {
    duration: '10m',
    stages: [
      { duration: '2m', target: 50 },   // Ramp up to 50 users
      { duration: '2m', target: 100 },  // Ramp to 100 users
      { duration: '4m', target: 100 },  // Stay at 100 users
      { duration: '2m', target: 0 }     // Ramp down
    ],
    thresholds: {
      'http_req_duration{staticAsset:no}': ['p(95)<500', 'p(99)<1000'],
      'http_req_failed': ['rate<0.05'],
      'http_requests': ['rate>200']
    }
  },

  // Scenario 3: Spike load (unexpected surge)
  spike: {
    duration: '10m',
    stages: [
      { duration: '1m', target: 10 },
      { duration: '2m', target: 500 },  // Sudden spike to 500 users
      { duration: '5m', target: 500 },  // Sustained spike
      { duration: '2m', target: 0 }     // Cool down
    ],
    thresholds: {
      'http_req_duration{staticAsset:no}': ['p(95)<1000'],
      'http_req_failed': ['rate<0.10'],
      'http_requests': ['rate>500']
    }
  },

  // Scenario 4: Sustained peak (marathon)
  sustained: {
    duration: '30m',
    stages: [
      { duration: '5m', target: 100 },
      { duration: '20m', target: 100 },
      { duration: '5m', target: 0 }
    ],
    thresholds: {
      'http_req_duration{staticAsset:no}': ['p(95)<500'],
      'http_req_failed': ['rate<0.01'],
      'http_requests': ['rate>200']
    }
  },

  // Scenario 5: Webhook stress
  webhookStress: {
    duration: '5m',
    stages: [
      { duration: '1m', target: 10 },
      { duration: '3m', target: 100 },  // 100 webhooks/second
      { duration: '1m', target: 0 }
    ],
    thresholds: {
      'http_req_duration': ['p(95)<5000'],
      'http_req_failed': ['rate<0.05'],
      'grpc_errors': ['rate<0.05']
    }
  }
};

/**
 * Caching configuration
 */
const cachingStrategy = {
  // Cache hit rate targets
  targets: {
    overall: 0.80,        // 80% hit rate
    userProfiles: 0.85,   // 85% hit rate
    products: 0.90,       // 90% hit rate (changes less)
    purchases: 0.70,      // 70% hit rate (changes often)
    analytics: 0.95       // 95% hit rate (stable data)
  },

  // TTL configuration (seconds)
  ttl: {
    userProfile: 300,     // 5 minutes
    product: 600,         // 10 minutes
    purchase: 900,        // 15 minutes
    analytics: 3600,      // 1 hour
    settings: 3600        // 1 hour
  },

  // Max cache size
  maxSize: {
    memoryGB: 2,          // 2GB max cache
    keyLimit: 100000      // Max 100k keys
  },

  // Cache invalidation strategy
  invalidation: {
    type: 'hybrid',       // hybrid = TTL + event-based
    events: [
      'userUpdated',
      'productUpdated',
      'purchaseCreated',
      'transactionCompleted'
    ]
  }
};

/**
 * Database optimization
 */
const databaseOptimization = {
  // Connection pool settings
  connectionPool: {
    min: 10,
    max: 100,
    idleTimeout: 300000   // 5 minutes
  },

  // Query optimization
  queryOptimization: {
    enableQueryCache: true,
    cacheSize: 256,       // MB
    enableBatchQueries: true,
    batchSize: 1000
  },

  // Slow query threshold
  slowQueryThreshold: 100, // milliseconds

  // Index hints
  indexes: [
    'users.email',
    'purchases.user_id',
    'purchases.status',
    'purchases.created_at',
    'products.category',
    'transactions.purchase_id'
  ]
};

/**
 * Response compression
 */
const compression = {
  enabled: true,
  level: 6,               // zlib compression level (1-9)
  threshold: 1024,        // Compress responses > 1KB
  types: [
    'text/plain',
    'text/css',
    'text/javascript',
    'application/json',
    'application/javascript'
  ]
};

/**
 * API pagination defaults
 */
const pagination = {
  defaultPageSize: 50,
  maxPageSize: 500,
  cursorBased: true       // Use cursor-based pagination (more efficient)
};

/**
 * Performance monitoring intervals
 */
const monitoringIntervals = {
  applicationMetrics: 60,       // 60 seconds
  databaseMetrics: 30,          // 30 seconds
  customMetrics: 300,           // 300 seconds
  cacheMetrics: 120,            // 120 seconds
  performanceReview: 3600       // 3600 seconds (hourly)
};

/**
 * Alert thresholds for performance degradation
 */
const alertThresholds = {
  apiLatencyP95: 500,           // milliseconds
  apiLatencyP99: 1000,          // milliseconds
  databaseLatencyP95: 200,      // milliseconds
  errorRate: 0.01,              // 1%
  cacheHitRate: 0.70,           // 70%
  connectionPoolUtilization: 0.80, // 80%
  cpuUsage: 0.80,               // 80%
  memoryUsage: 0.85             // 85%
};

/**
 * Optimization recommendations based on metrics
 */
const optimizationHints = {
  highApiLatency: [
    'Check database query performance',
    'Verify cache hit rate',
    'Review slow query logs',
    'Check for N+1 query problems'
  ],
  highErrorRate: [
    'Check application logs for errors',
    'Verify database connectivity',
    'Review external API integrations',
    'Check for resource exhaustion'
  ],
  lowCacheHitRate: [
    'Increase cache TTL',
    'Verify cache invalidation logic',
    'Check cache key patterns',
    'Review cache size limits'
  ],
  highDatabaseLoad: [
    'Add missing indexes',
    'Optimize slow queries',
    'Increase connection pool size',
    'Implement query batching'
  ]
};

module.exports = {
  performanceTargets,
  loadTestScenarios,
  cachingStrategy,
  databaseOptimization,
  compression,
  pagination,
  monitoringIntervals,
  alertThresholds,
  optimizationHints
};
