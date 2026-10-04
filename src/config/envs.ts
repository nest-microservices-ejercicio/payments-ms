import 'dotenv/config';
import z from "zod";

const envSchema = z.object({
    PORT: z.coerce.number(),
    STRIPE_SECRET: z.string(),
})

const result = envSchema.safeParse(process.env);

if(!result.success) {
    throw new Error(
        `Config validation error: ${result.error.message}`,
    );
}

export const envs = {
    port: result.data.PORT,
    stripeSecret: result.data.STRIPE_SECRET
}