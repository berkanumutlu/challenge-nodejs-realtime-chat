import { Router } from "express"
import authRoutes from "@/routes/auth.routes"
import userRoutes from "@/routes/user.routes"
import conversationRoutes from "@/routes/conversation.routes"

const mainRouter = Router()

// Route list
mainRouter.use('/auth', authRoutes)
mainRouter.use('/user', userRoutes)
mainRouter.use('/conversation', conversationRoutes)

// Route not found definition
mainRouter.use((req, res) => {
    res.warning(`The route ${req.method} ${req.originalUrl} does not exist`, 404)
})

export default mainRouter