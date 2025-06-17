import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    STRIPE_SECRET_KEY: string;
    BASE_URL: string;
    STRIPE_ENDPOINTSECRET: string;
    NATS_SERVERS: string[];
}

const envVarsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    BASE_URL: joi.string().uri().required(),
    STRIPE_ENDPOINTSECRET: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string() ).required(),
}).unknown(true);

const { error, value } = envVarsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if ( error ) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,
    stripeSecretKey: envVars.STRIPE_SECRET_KEY,
    baseUrl: envVars.BASE_URL,
    stripeEndpointSecret: envVars.STRIPE_ENDPOINTSECRET,
    natsServers: envVars.NATS_SERVERS,
};