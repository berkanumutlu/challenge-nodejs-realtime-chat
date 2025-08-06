import { Router } from "express"
import { createConversationSchema } from "@/validations/conversation.validation"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { validateRequestBody } from "@/middlewares/validation.middleware"
import { getUserConversations, getConversationDetailsAndMessages, createNewConversation, leaveConversation } from "@/controllers/conversation.controller"

const conversationRouter = Router()

conversationRouter.get("/list", authenticatedMiddleware, getUserConversations)
conversationRouter.get("/get/:conversationId", authenticatedMiddleware, getConversationDetailsAndMessages)
conversationRouter.post("/create", authenticatedMiddleware, validateRequestBody(createConversationSchema), createNewConversation)
conversationRouter.delete("/leave/:conversationId", authenticatedMiddleware, leaveConversation)

export default conversationRouter