import { rateLimit } from "express-rate-limit"
import { appConfig } from "@/config/app.config"
import { createResponse } from "@/middlewares/response.middleware"

export const apiRateLimiter = rateLimit({
    windowMs: appConfig.rateLimit.windowMs,
    max: appConfig.rateLimit.max,
    message: createResponse(false, 429, appConfig.rateLimit.message, null, null),
    standardHeaders: true, // Adds rate limit information to HTTP headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Disables X-RateLimit-* headers
})

export const authRateLimiter = rateLimit({
    windowMs: appConfig.rateLimit.authWindowMs,
    max: appConfig.rateLimit.authMax,
    message: createResponse(false, 429, appConfig.rateLimit.authMessage, null, null),
    standardHeaders: true,
    legacyHeaders: false,
})