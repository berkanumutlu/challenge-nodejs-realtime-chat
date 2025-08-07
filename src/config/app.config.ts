import { env } from "@/config/env.config"

export const appConfig = {
    env: env.app.env,
    port: env.app.port,
    cors: env.cors,
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Max 100 requests per IP per windowMs
        message: "Too many requests from this IP, please try again after 15 minutes",
        authWindowMs: 5 * 60 * 1000, // 5 minutes for authentication routes
        authMax: 10, // Max 10 requests for authentication routes per authWindowMs
        authMessage: "Too many authentication attempts from this IP, please try again after 5 minutes",
    },
}