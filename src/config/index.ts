import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceKey: requireEnv('SUPABASE_SERVICE_KEY'),
  },

  whatsapp: {
    phoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
    accessToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),
    verifyToken: requireEnv('WHATSAPP_VERIFY_TOKEN'),
    appSecret: optionalEnv('WHATSAPP_APP_SECRET', ''),
  },

  session: {
    secret: requireEnv('SESSION_SECRET'),
  },

  broadcast: {
    delayMs: parseInt(optionalEnv('BROADCAST_DELAY_MS', '100'), 10),
  },

  testPhoneNumbers: optionalEnv('TEST_PHONE_NUMBERS', '').split(',').filter(Boolean),
};

export function validateConfig(): void {
  // This will throw if required env vars are missing
  // Called at startup
  console.log('Configuration validated');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Port: ${config.port}`);
}
