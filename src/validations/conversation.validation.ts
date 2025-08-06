import { z } from "zod"
import { isValidObjectId } from "@/validations/db.validation"

export const createConversationSchema = z.object({
    participantIds: z
        .array(z.string("participantIds is required").refine(isValidObjectId, { message: "Invalid participantId" }))
        .min(1, "Must have at least one participantId"),
})
export type CreateConversationInputType = z.infer<typeof createConversationSchema>

export const conversationIdParamSchema = z.object({
    conversationId: z.string("conversationId is required").refine(isValidObjectId, {
        message: "Invalid conversationId",
    }),
})
export type ConversationIdParamType = z.infer<typeof conversationIdParamSchema>

export const typingStatusSchema = z.object({
    conversationId: z.string("conversationId is required").refine(isValidObjectId, {
        message: "Invalid conversationId",
    }),
})
export type TypingStatusInputType = z.infer<typeof typingStatusSchema>