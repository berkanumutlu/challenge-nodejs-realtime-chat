import type { Response, NextFunction } from "express"
import type { IAuthenticatedRequest } from "@/types/request"
import { conversationIdParamSchema, createConversationSchema } from "@/validations/conversation.validation"
import { createConversation, findConversationById, findExistingConversationByParticipants, findUserConversations, removeParticipantFromConversation } from "@/services/conversation.service"
import { findMessagesByConversationId } from "@/services/message.service"
import { checkUsersExistAndActive } from "@/services/user.service"
import { getSocketIO } from "@/services/socket.service"
import { createPaginatedResponseData } from "@/utils/response.util"
import { getRoomKey } from "@/utils/socket.util"

export const getUserConversations = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const limit = Number.parseInt(req.query.limit as string) || 0
        const offset = Number.parseInt(req.query.offset as string) || 0

        const { conversations, total } = await findUserConversations(req.user.id, limit, offset)

        res.success(createPaginatedResponseData(conversations, total, limit, offset))
    } catch (error) {
        next(error)
    }
}

export const getConversationDetailsAndMessages = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = conversationIdParamSchema.parse(req.params)
        const messageLimit = Number.parseInt(req.query.messageLimit as string) || 0
        const messageOffset = Number.parseInt(req.query.messageOffset as string) || 0

        const conversation = await findConversationById(conversationId)
        if (!conversation) {
            return res.warning("Conversation not found", 404)
        }
        if (!conversation.participants.some((p) => p.equals(req.user!.id))) {
            return res.warning("You are not a participant of this conversation", 403)
        }

        const { messages, total } = await findMessagesByConversationId(conversationId, messageLimit, messageOffset)

        res.success(
            {
                conversation: conversation.toObject(),
                messages: createPaginatedResponseData(messages, total, messageLimit, messageOffset),
            }
        )
    } catch (error) {
        next(error)
    }
}

export const createNewConversation = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { participantIds } = createConversationSchema.parse(req.body)

        const allParticipantIds = [...new Set([...participantIds, req.user.id])]

        if (allParticipantIds.length < 2) {
            return res.warning("A conversation must have at least two participants", 400)
        }

        const allParticipantsValid = await checkUsersExistAndActive(allParticipantIds)
        if (!allParticipantsValid) {
            return res.warning("One or more participantIds are invalid, inactive, or deleted", 400)
        }

        const existingConversation = await findExistingConversationByParticipants(allParticipantIds)
        if (existingConversation) {
            return res.success(existingConversation.toObject(), "Conversation already exists")
        }

        const newConversation = await createConversation(allParticipantIds, req.user.id)

        res.success(newConversation.toObject(), "Conversation created successfully", 201)
    } catch (error) {
        next(error)
    }
}

export const leaveConversation = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = conversationIdParamSchema.parse(req.params)
        const userId = req.user.id
        const username = req.user.username

        const conversation = await findConversationById(conversationId)
        if (!conversation) {
            return res.warning("Conversation not found", 404)
        }

        if (!conversation.participants.some((p) => p.equals(userId))) {
            return res.warning("You are not a participant of this conversation", 403)
        }

        const io = getSocketIO()
        const roomKey = getRoomKey(conversationId)

        if (conversation.participants.length === 2) {
            await conversation.softDelete(userId)
            io.to(roomKey).emit("user_left_conversation", {
                conversationId,
                userId,
                username,
                message: `${username} has left the conversation (conversation closed)`,
            })
            return res.success(null, "Conversation closed successfully as you were the last participant", 200)
        }

        const updatedConversation = await removeParticipantFromConversation(conversationId, userId)

        if (updatedConversation) {
            io.to(roomKey).emit("user_left_conversation", {
                conversationId,
                userId,
                username,
                message: `${username} has left the conversation`,
            })
            res.success(updatedConversation.toObject(), "Successfully left the conversation", 200)
        } else {
            res.warning("Failed to leave the conversation", 500)
        }
    } catch (error) {
        next(error)
    }
}