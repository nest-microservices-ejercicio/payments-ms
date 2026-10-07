import 'dotenv/config';
import z from "zod";

const envSchema = z.object({
    PORT: z.coerce.number(),

    STRIPE_SECRET: z.string(),
    STRIPE_SUCCESS_URL: z.string(),
    STRIPE_CANCEL_URL: z.string(),
    STRIPE_ENDPOINT_SECRET: z.string(),

    NATS_SERVERS: z
        .string()
        .transform((value) => value.split(',').map((server) => server.trim()))
        .pipe(z.array(z.string().min(1)).min(1)),
})

const result = envSchema.safeParse(process.env);

if(!result.success) {
    throw new Error(
        `Config validation error: ${result.error.message}`,
    );
}

export const envs = {
    port: result.data.PORT,

    stripeSecret: result.data.STRIPE_SECRET,
    stripeSuccesUrl: result.data.STRIPE_SUCCESS_URL,
    stripeCancelUrl: result.data.STRIPE_SUCCESS_URL,
    stripeEndPointSecret: result.data.STRIPE_ENDPOINT_SECRET,

    natsServers: result.data.NATS_SERVERS
}