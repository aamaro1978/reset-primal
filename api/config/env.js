require('dotenv').config();

// Variáveis obrigatórias
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'HOTMART_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL'
];

// Variáveis opcionais (com valores padrão)
const OPTIONAL_ENV_VARS = {
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  CORS_ORIGIN: 'https://resetprimal.com.br',
  LOG_LEVEL: 'info',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW_MS: '60000',
  GOOGLE_ANALYTICS_PROPERTY_ID: '',
  GOOGLE_ANALYTICS_API_SECRET: '',
  FACEBOOK_PIXEL_ID: '',
  FACEBOOK_PIXEL_TOKEN: ''
};

function validateEnv() {
  console.log('🔍 Validando variáveis de ambiente...');

  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias faltando:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  // Validações específicas
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET muito curto (mínimo 32 caracteres)');
  }

  console.log('✅ Variáveis de ambiente validadas com sucesso');
}

function getEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

module.exports = {
  validateEnv,
  getEnv,
  env: {
    // Core
    NODE_ENV: process.env.NODE_ENV,
    PORT: parseInt(process.env.PORT || '3000'),
    DATABASE_URL: process.env.DATABASE_URL,

    // Auth
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '24h'),
    REFRESH_TOKEN_EXPIRES_IN: getEnv('REFRESH_TOKEN_EXPIRES_IN', '7d'),

    // API
    CORS_ORIGIN: getEnv('CORS_ORIGIN', 'https://resetprimal.com.br'),
    LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),

    // Rate Limiting
    RATE_LIMIT_REQUESTS: parseInt(getEnv('RATE_LIMIT_REQUESTS', '100')),
    RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '60000')),

    // Hotmart
    HOTMART_WEBHOOK_SECRET: process.env.HOTMART_WEBHOOK_SECRET,
    HOTMART_AFFILIATE_LINK: process.env.HOTMART_AFFILIATE_LINK,

    // SendGrid
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,

    // Google Analytics 4
    GOOGLE_ANALYTICS_PROPERTY_ID: getEnv('GOOGLE_ANALYTICS_PROPERTY_ID', ''),
    GOOGLE_ANALYTICS_API_SECRET: getEnv('GOOGLE_ANALYTICS_API_SECRET', ''),

    // Facebook Pixel
    FACEBOOK_PIXEL_ID: getEnv('FACEBOOK_PIXEL_ID', ''),
    FACEBOOK_PIXEL_TOKEN: getEnv('FACEBOOK_PIXEL_TOKEN', '')
  }
};
