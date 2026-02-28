import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5100),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.number().integer().positive().default(900),
  JWT_REFRESH_EXPIRATION: Joi.number().integer().positive().default(604800),
  SEED_ADMIN_EMAIL: Joi.string().email().default('admin@acception.com'),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).required(),
  EMAIL_PROVIDER: Joi.string().valid('console').default('console'),
});
