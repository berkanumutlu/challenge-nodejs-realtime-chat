import { Router } from "express"
import { loginSchema, refreshTokenSchema, registerSchema } from "@/validations/user.validation"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { validateRequestBody } from "@/middlewares/validation.middleware"
import { authRateLimiter } from "@/middlewares/rateLimit.middleware"
import { register, login, refreshToken, logout, me } from "@/controllers/auth.controller"

const authRouter = Router()

authRouter.post("/register", authRateLimiter, validateRequestBody(registerSchema), register)
authRouter.post("/login", authRateLimiter, validateRequestBody(loginSchema), login)
authRouter.post("/refresh", authRateLimiter, validateRequestBody(refreshTokenSchema), refreshToken)
authRouter.post("/logout", authenticatedMiddleware, logout)
authRouter.get("/me", authenticatedMiddleware, me)

export default authRouter