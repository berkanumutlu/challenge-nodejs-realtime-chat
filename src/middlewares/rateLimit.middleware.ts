import type { Request, Response, NextFunction } from "express"
import { rateLimit } from "express-rate-limit"
import { appConfig } from "@/config/app.config"
import { createResponse } from "@/middlewares/response.middleware"

// Disable rate limiting in the test environment
const isTestEnvironment = process.env.NODE_ENV === "test"

// Dummy middleware for test environment
const noOpMiddleware = (req: Request, res: Response, next: NextFunction) => {
    next()
}

// Rate limit for public API routes
export const apiRateLimiter = isTestEnvironment
    ? noOpMiddleware
    : rateLimit({
        windowMs: appConfig.rateLimit.windowMs,
        max: appConfig.rateLimit.max,
        message: createResponse(false, 429, appConfig.rateLimit.message, null, null),
        standardHeaders: true, // Adds rate limit information to HTTP headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
        legacyHeaders: false, // Disables X-RateLimit-* headers
    })

// Tighter rate limit for authentication (login, register) routes
export const authRateLimiter = isTestEnvironment
    ? noOpMiddleware
    : rateLimit({
        windowMs: appConfig.rateLimit.authWindowMs,
        max: appConfig.rateLimit.authMax,
        message: createResponse(false, 429, appConfig.rateLimit.authMessage, null, null),
        standardHeaders: true,
        legacyHeaders: false,
    })