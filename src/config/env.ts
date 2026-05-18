import { z } from 'zod'
import dotenv from 'dotenv'
import type { StringValue } from 'ms'

dotenv.config()

/**
 * Environment variable schema with strict validation
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  SIGNATURE_MESSAGE: z.string().min(10, 'SIGNATURE_MESSAGE too short'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().max(24 * 60 * 60 * 1000).default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),
  CHAIN_ID: z.string().optional(),
  RPC_URL: z.string().url().optional(),
  HELMET_ENABLED: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  // MongoDB configuration
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().default('exhibition_db'),
})

let env: z.infer<typeof envSchema>

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:')
    error.errors.forEach((err: { path: any[]; message: any }) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
  }
  throw error
}

export const config = Object.freeze({
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isCustomDomain: env.FRONTEND_URL.includes('exhibitiondefi.xyz'),
  },
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN as StringValue,
  },
  auth: {
    signatureMessage: env.SIGNATURE_MESSAGE,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  csrf: {
    secret: env.CSRF_SECRET,
  },
  chain: {
    chainId: env.CHAIN_ID ?? null,
    rpcUrl: env.RPC_URL ?? null,
  },
  security: {
    helmetEnabled: env.HELMET_ENABLED,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  database: {
    mongoUri: env.MONGODB_URI,
    dbName: env.DB_NAME,
  },
} as const)

// Validate secrets
if (config.jwt.secret.includes('change-this')) {
  console.error('❌ JWT_SECRET is placeholder! Generate: openssl rand -base64 32')
  if (config.server.isProduction) process.exit(1)
}

if (config.csrf.secret.includes('change-this')) {
  console.error('❌ CSRF_SECRET is placeholder! Generate: openssl rand -base64 32')
  if (config.server.isProduction) process.exit(1)
}

// Validate MongoDB URI
if (!config.database.mongoUri || config.database.mongoUri.includes('change-this')) {
  console.error('❌ MONGODB_URI is missing or placeholder!')
  if (config.server.isProduction) process.exit(1)
}

if (!config.server.isProduction) {
  console.log('✅ Environment validation passed')
  console.log(`   Mode: ${config.server.nodeEnv}`)
  console.log(`   Port: ${config.server.port}`)
  console.log(`   Frontend: ${config.cors.origin}`)
  console.log(`   Database: ${config.database.dbName}`)
}