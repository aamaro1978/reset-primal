/**
 * Caching Configuration - Reset Primal
 *
 * Redis-based caching with cache-aside pattern
 * TTL: 5 minutes for hot data, 1 hour for analytics
 */

const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  enableOfflineQueue: true
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

/**
 * Cache TTL configuration
 */
const cacheTTL = {
  // Hot data - frequently accessed, changes often
  user: 300,                // 5 minutes
  userProfile: 300,         // 5 minutes
  product: 600,             // 10 minutes
  productCatalog: 600,      // 10 minutes
  recentPurchases: 60,      // 1 minute (changes frequently)

  // Warm data - accessed regularly, changes less often
  purchase: 900,            // 15 minutes
  transaction: 1800,        // 30 minutes

  // Cold data - infrequently accessed
  analytics: 3600,          // 1 hour
  dailySummary: 3600,       // 1 hour
  monthlySummary: 86400,    // 1 day
  settings: 3600            // 1 hour
};

/**
 * Cache key patterns for invalidation
 */
const cacheKeys = {
  user: (userId) => `user:${userId}`,
  userEmail: (email) => `user:email:${email}`,
  product: (productId) => `product:${productId}`,
  productCategory: (category) => `product:category:${category}`,
  productCatalog: () => 'products:catalog:all',
  purchase: (purchaseId) => `purchase:${purchaseId}`,
  userPurchases: (userId) => `user:${userId}:purchases`,
  userRecentPurchases: (userId, limit = 10) => `user:${userId}:purchases:recent:${limit}`,
  transaction: (transactionId) => `transaction:${transactionId}`,
  analytics: (metric, period) => `analytics:${metric}:${period}`,
  dailySales: (date) => `analytics:daily_sales:${date}`,
  monthlySales: (month) => `analytics:monthly_sales:${month}`,
  settings: (key) => `settings:${key}`
};

/**
 * Get value from cache with fallback to database
 * Implements cache-aside pattern
 */
const cacheGet = async (key, dbFetch, ttl = 300) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try cache first
      client.get(key, async (err, cached) => {
        if (err) {
          console.error(`Cache get error for ${key}:`, err);
          // Fall back to database on cache error
          try {
            const data = await dbFetch();
            return resolve(data);
          } catch (dbErr) {
            return reject(dbErr);
          }
        }

        if (cached) {
          try {
            // Cache hit
            return resolve(JSON.parse(cached));
          } catch (parseErr) {
            console.error(`Failed to parse cached value for ${key}:`, parseErr);
            // Fallback to database if cache data is corrupted
            try {
              const data = await dbFetch();
              return resolve(data);
            } catch (dbErr) {
              return reject(dbErr);
            }
          }
        }

        // Cache miss - fetch from database
        try {
          const data = await dbFetch();

          // Store in cache
          if (data) {
            client.setex(key, ttl, JSON.stringify(data), (err) => {
              if (err) {
                console.error(`Cache set error for ${key}:`, err);
              }
            });
          }

          resolve(data);
        } catch (dbErr) {
          reject(dbErr);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Set value in cache
 */
const cacheSet = async (key, value, ttl = 300) => {
  return new Promise((resolve, reject) => {
    try {
      client.setex(key, ttl, JSON.stringify(value), (err) => {
        if (err) {
          console.error(`Cache set error for ${key}:`, err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete value from cache
 */
const cacheDel = async (key) => {
  return new Promise((resolve, reject) => {
    try {
      client.del(key, (err, count) => {
        if (err) {
          console.error(`Cache delete error for ${key}:`, err);
          reject(err);
        } else {
          resolve(count > 0);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete multiple keys with pattern matching
 */
const cacheDelPattern = async (pattern) => {
  return new Promise((resolve, reject) => {
    try {
      client.keys(pattern, (err, keys) => {
        if (err) {
          console.error(`Cache pattern delete error for ${pattern}:`, err);
          reject(err);
        } else if (keys.length === 0) {
          resolve(0);
        } else {
          client.del(...keys, (err, count) => {
            if (err) {
              console.error(`Cache delete error for ${pattern}:`, err);
              reject(err);
            } else {
              resolve(count);
            }
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Invalidate user-related caches
 */
const invalidateUserCache = async (userId, email = null) => {
  const keys = [
    cacheKeys.user(userId),
    cacheKeys.userPurchases(userId),
    cacheKeys.userRecentPurchases(userId)
  ];

  if (email) {
    keys.push(cacheKeys.userEmail(email));
  }

  for (const key of keys) {
    await cacheDel(key);
  }
};

/**
 * Invalidate product-related caches
 */
const invalidateProductCache = async (productId, category = null) => {
  const keys = [
    cacheKeys.product(productId),
    cacheKeys.productCatalog()
  ];

  if (category) {
    keys.push(cacheKeys.productCategory(category));
  }

  for (const key of keys) {
    await cacheDel(key);
  }
};

/**
 * Invalidate purchase-related caches
 */
const invalidatePurchaseCache = async (purchaseId, userId) => {
  const keys = [
    cacheKeys.purchase(purchaseId),
    cacheKeys.userPurchases(userId),
    cacheKeys.userRecentPurchases(userId)
  ];

  for (const key of keys) {
    await cacheDel(key);
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  return new Promise((resolve, reject) => {
    client.info('stats', (err, info) => {
      if (err) {
        reject(err);
      } else {
        // Parse INFO response
        const stats = {};
        info.split('\r\n').forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = isNaN(value) ? value : parseInt(value);
          }
        });
        resolve(stats);
      }
    });
  });
};

/**
 * Flush cache (use with caution)
 */
const flushCache = async () => {
  return new Promise((resolve, reject) => {
    client.flushdb((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * Cache health check
 */
const cacheHealthCheck = async () => {
  return new Promise((resolve) => {
    client.ping((err, reply) => {
      if (err || reply !== 'PONG') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports = {
  client,
  cacheTTL,
  cacheKeys,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  invalidateUserCache,
  invalidateProductCache,
  invalidatePurchaseCache,
  getCacheStats,
  flushCache,
  cacheHealthCheck
};
