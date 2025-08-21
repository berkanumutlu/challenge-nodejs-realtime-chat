import { Router } from "express"
import authRoutes from "@/routes/auth.routes"
import userRoutes from "@/routes/user.routes"
import conversationRoutes from "@/routes/conversation.routes"
import { apiRateLimiter } from "@/middlewares/rateLimit.middleware"

const mainRouter = Router()

// API rate limit
mainRouter.use(apiRateLimiter)

// Route list
mainRouter.use("/auth", authRoutes)
mainRouter.use("/user", userRoutes)
mainRouter.use("/conversation", conversationRoutes)

// Route not found definition
mainRouter.use((req, res) => {
    res.warning(`The route ${req.method} ${req.originalUrl} does not exist`, 404)
})

export default mainRouter