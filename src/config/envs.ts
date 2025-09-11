import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  NATS_SERVERS: string[];
}

const envVarsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_WEBHOOK_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const envVarsResult = envVarsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(',') || [],
});

if (envVarsResult.error) {
  throw new Error(
    `Configuration validation error: ${envVarsResult.error.message}`,
  );
}

const envVars = envVarsResult.value;

export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeWebhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  natsServers: envVars.NATS_SERVERS,
};
