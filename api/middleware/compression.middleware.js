/**
 * Compression Middleware - Reset Primal
 *
 * Gzip compression for API responses to reduce bandwidth
 * Reduces response size by 60-70% typically
 */

const zlib = require('zlib');
const { compression: compressionConfig } = require('../../config/performance');

/**
 * Response compression middleware
 * Automatically compresses responses based on Content-Type and size
 */
const compressionMiddleware = (req, res, next) => {
  // Check if client supports gzip compression
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  // Store original response methods
  const originalJson = res.json;
  const originalSend = res.send;
  const originalWrite = res.write;

  // Track if response is already being compressed
  let isCompressed = false;

  /**
   * Should this response be compressed?
   */
  const shouldCompress = (data) => {
    // Check content type
    const contentType = res.getHeader('content-type') || '';
    const isCompressibleType = compressionConfig.types.some((type) => contentType.includes(type));

    if (!isCompressibleType) {
      return false;
    }

    // Check response size
    const size = typeof data === 'string' ? Buffer.byteLength(data) : data?.length || 0;
    return size > compressionConfig.threshold;
  };

  /**
   * Compress and send response
   */
  const sendCompressed = (data, encoding = 'utf-8') => {
    return new Promise((resolve, reject) => {
      // Convert data to buffer
      const buffer = typeof data === 'string' ? Buffer.from(data, encoding) : data;

      // Compress using gzip
      zlib.gzip(buffer, { level: compressionConfig.level }, (err, compressed) => {
        if (err) {
          console.error('Compression error:', err);
          // Send uncompressed on error
          resolve(buffer);
        } else {
          // Add compression headers
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');

          // Log compression ratio
          const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(2);
          res.setHeader('X-Compression-Ratio', `${ratio}%`);

          resolve(compressed);
        }
      });
    });
  };

  /**
   * Override res.json()
   */
  res.json = function (data) {
    if (isCompressed) {
      return originalJson.call(this, data);
    }

    const jsonString = JSON.stringify(data);

    if (shouldCompress(jsonString)) {
      isCompressed = true;

      sendCompressed(jsonString)
        .then((compressed) => {
          res.setHeader('Content-Length', Buffer.byteLength(compressed));
          return originalSend.call(res, compressed);
        })
        .catch((err) => {
          console.error('Compression failed:', err);
          res.setHeader('Content-Length', Buffer.byteLength(jsonString));
          return originalSend.call(res, jsonString);
        });

      return res;
    } else {
      res.setHeader('Content-Length', Buffer.byteLength(jsonString));
      return originalJson.call(this, data);
    }
  };

  /**
   * Override res.send()
   */
  res.send = function (data) {
    if (isCompressed) {
      return originalSend.call(this, data);
    }

    if (shouldCompress(data)) {
      isCompressed = true;

      sendCompressed(data)
        .then((compressed) => {
          res.setHeader('Content-Length', Buffer.byteLength(compressed));
          return originalSend.call(res, compressed);
        })
        .catch((err) => {
          console.error('Compression failed:', err);
          if (typeof data === 'string') {
            res.setHeader('Content-Length', Buffer.byteLength(data));
          }
          return originalSend.call(res, data);
        });

      return res;
    } else {
      return originalSend.call(this, data);
    }
  };

  /**
   * Override res.write() for streaming
   */
  res.write = function (chunk, encoding) {
    if (isCompressed) {
      return originalWrite.call(this, chunk, encoding);
    }

    if (shouldCompress(chunk)) {
      isCompressed = true;

      // Set compression headers
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');

      // Create gzip transform stream
      const gzipStream = zlib.createGzip({ level: compressionConfig.level });

      // Replace write with compressed write
      return gzipStream.write(chunk, encoding);
    } else {
      return originalWrite.call(this, chunk, encoding);
    }
  };

  next();
};

/**
 * Brotli compression middleware (alternative to gzip)
 * Better compression ratio but slower
 */
const brotliCompressionMiddleware = (req, res, next) => {
  // Check if client supports brotli compression
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (!acceptEncoding.includes('br')) {
    return compressionMiddleware(req, res, next);
  }

  // Similar to gzip but using brotli
  const originalJson = res.json;
  const originalSend = res.send;

  const shouldCompress = (data) => {
    const contentType = res.getHeader('content-type') || '';
    const isCompressibleType = compressionConfig.types.some((type) => contentType.includes(type));

    if (!isCompressibleType) {
      return false;
    }

    const size = typeof data === 'string' ? Buffer.byteLength(data) : data?.length || 0;
    return size > compressionConfig.threshold;
  };

  res.json = function (data) {
    const jsonString = JSON.stringify(data);

    if (shouldCompress(jsonString)) {
      zlib.brotliCompress(
        Buffer.from(jsonString),
        { quality: 6 }, // 6 is default quality
        (err, compressed) => {
          if (err) {
            console.error('Brotli compression error:', err);
            res.setHeader('Content-Length', Buffer.byteLength(jsonString));
            return originalJson.call(res, data);
          }

          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Content-Length', Buffer.byteLength(compressed));

          return originalSend.call(res, compressed);
        }
      );
    } else {
      return originalJson.call(this, data);
    }
  };

  next();
};

/**
 * Disable compression for specific responses
 */
const noCompressionForPath = (path) => {
  return (req, res, next) => {
    if (req.path.includes(path)) {
      // Disable compression
      res.setHeader('Content-Encoding', 'identity');
    }
    next();
  };
};

module.exports = {
  compressionMiddleware,
  brotliCompressionMiddleware,
  noCompressionForPath,
};
