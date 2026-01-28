const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getEnv, env } = require('../config/env');

// ════════════════════════════════════════════════════════════════
// Bcrypt - Password Hashing
// ════════════════════════════════════════════════════════════════

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePasswords(password, hash) {
  return bcrypt.compare(password, hash);
}

// ════════════════════════════════════════════════════════════════
// JWT - Token Management
// ════════════════════════════════════════════════════════════════

function generateToken(payload, expiresIn = env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirou');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw error;
  }
}

function createAuthTokens(userId, email, role) {
  const payload = {
    sub: userId,
    email,
    role
  };

  return {
    token: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  };
}

// ════════════════════════════════════════════════════════════════
// HMAC - Webhook Signature Verification
// ════════════════════════════════════════════════════════════════

function verifyHMACSignature(data, signature, secret) {
  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    // Usar timingSafeEqual para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    return false;
  }
}

function computeHMAC(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

// ════════════════════════════════════════════════════════════════
// Random Tokens
// ════════════════════════════════════════════════════════════════

function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateVerificationCode(length = 6) {
  return crypto
    .randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

module.exports = {
  // Password
  hashPassword,
  comparePasswords,

  // JWT
  generateToken,
  generateRefreshToken,
  verifyToken,
  createAuthTokens,

  // HMAC
  verifyHMACSignature,
  computeHMAC,

  // Random
  generateRandomToken,
  generateVerificationCode
};
