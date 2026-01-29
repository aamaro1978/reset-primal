/**
 * Caching Middleware - Reset Primal
 *
 * Implements cache-aside pattern for API responses
 * Reduces database load and improves response times
 */

const { cacheGet, cacheSet, cacheTTL, cacheKeys } = require('../../config/cache');

/**
 * Cache middleware for GET requests
 * Caches responses based on URL and query parameters
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build cache key from URL and query parameters
    const cacheKey = buildCacheKey(req);

    // Skip caching for specific patterns
    if (shouldSkipCache(req)) {
      return next();
    }

    try {
      // Try to get from cache
      const cached = await getCached(cacheKey);

      if (cached) {
        // Cache hit
        res.setHeader('X-Cache-Hit', 'true');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(cached);
      }

      // Cache miss - proceed to handler, but intercept response
      res.setHeader('X-Cache-Hit', 'false');

      const originalJson = res.json;
      res.json = function (data) {
        // Store in cache before sending response
        if (res.statusCode === 200 && data) {
          setCachedAsync(cacheKey, data, ttl);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      // Cache error - log but continue without caching
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * User-specific cache middleware
 * Caches per-user data with user ID in cache key
 */
const userCacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.user) {
      return next();
    }

    const cacheKey = buildUserCacheKey(req);

    try {
      const cached = await getCached(cacheKey);

      if (cached) {
        res.setHeader('X-Cache-Hit', 'true');
        return res.status(200).json(cached);
      }

      res.setHeader('X-Cache-Hit', 'false');

      const originalJson = res.json;
      res.json = function (data) {
        if (res.statusCode === 200 && data) {
          setCachedAsync(cacheKey, data, ttl);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('User cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Clears caches after write operations
 */
const cacheInvalidationMiddleware = async (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const originalJson = res.json;
  res.json = async function (data) {
    // Invalidate relevant caches after successful write
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await invalidateCachesForRoute(req);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Build cache key from request
 */
const buildCacheKey = (req) => {
  const path = req.path;
  const query = JSON.stringify(req.query || {});
  return `request:${path}:${query}`;
};

/**
 * Build user-specific cache key
 */
const buildUserCacheKey = (req) => {
  const path = req.path;
  const userId = req.user?.id;
  const query = JSON.stringify(req.query || {});
  return `user:${userId}:${path}:${query}`;
};

/**
 * Determine if request should bypass cache
 */
const shouldSkipCache = (req) => {
  const path = req.path;
  const query = req.query;

  // Skip health checks
  if (path.includes('/health')) {
    return true;
  }

  // Skip if cache=false in query string
  if (query.cache === 'false') {
    return true;
  }

  // Skip if Authorization header missing (probably admin request)
  if (!req.headers.authorization && path.includes('/api/')) {
    return true;
  }

  // Skip if debug mode enabled
  if (query.debug === 'true') {
    return true;
  }

  return false;
};

/**
 * Get value from cache
 */
const getCached = async (key) => {
  return new Promise((resolve, reject) => {
    try {
      const redis = require('redis').createClient();
      redis.get(key, (err, data) => {
        if (err) {
          reject(err);
        } else if (data) {
          try {
            resolve(JSON.parse(data));
          } catch (parseErr) {
            reject(parseErr);
          }
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Set value in cache asynchronously (don't block response)
 */
const setCachedAsync = (key, value, ttl) => {
  setImmediate(async () => {
    try {
      await cacheSet(key, value, ttl);
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  });
};

/**
 * Invalidate caches based on route
 */
const invalidateCachesForRoute = async (req) => {
  const path = req.path;

  try {
    if (path.includes('/users')) {
      // Invalidate user caches
      await cacheInvalidatePattern('user:*');
      await cacheInvalidatePattern('request:/api/users*');
    } else if (path.includes('/products')) {
      // Invalidate product caches
      await cacheInvalidatePattern('product:*');
      await cacheInvalidatePattern('request:/api/products*');
    } else if (path.includes('/purchases')) {
      // Invalidate purchase caches
      await cacheInvalidatePattern('purchase:*');
      await cacheInvalidatePattern('user:*:purchases*');
      await cacheInvalidatePattern('request:/api/purchases*');
    } else if (path.includes('/transactions')) {
      // Invalidate transaction caches
      await cacheInvalidatePattern('transaction:*');
      await cacheInvalidatePattern('request:/api/transactions*');
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    // Don't block response on invalidation error
  }
};

/**
 * Invalidate cache with pattern matching
 */
const cacheInvalidatePattern = async (pattern) => {
  return new Promise((resolve, reject) => {
    try {
      const redis = require('redis').createClient();
      redis.keys(pattern, (err, keys) => {
        if (err) {
          reject(err);
        } else if (keys.length === 0) {
          resolve();
        } else {
          redis.del(...keys, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  cacheMiddleware,
  userCacheMiddleware,
  cacheInvalidationMiddleware,
};
