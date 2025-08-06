import { Router } from "express"
import { loginSchema, refreshTokenSchema, registerSchema } from "@/validations/user.validation"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { validateRequestBody } from "@/middlewares/validation.middleware"
import { register, login, refreshToken, logout, me } from "@/controllers/auth.controller"

const authRouter = Router()

authRouter.post("/register", validateRequestBody(registerSchema), register)
authRouter.post("/login", validateRequestBody(loginSchema), login)
authRouter.post("/refresh", validateRequestBody(refreshTokenSchema), refreshToken)
authRouter.post("/logout", authenticatedMiddleware, logout)
authRouter.get("/me", authenticatedMiddleware, me)

export default authRouter