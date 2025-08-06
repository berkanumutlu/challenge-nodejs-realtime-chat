import { z } from "zod"
import { isValidObjectId } from "@/validations/db.validation"

export const messageContentSchema = z.object({
    content: z
        .string("Message content cannot be empty")
        .min(1, "Message is required")
        .max(1000, "Message content must be at most 1000 characters")
        .trim(),
})
export type MessageContentInputType = z.infer<typeof messageContentSchema>

export const messageReadSchema = z.object({
    messageId: z.string().refine(isValidObjectId, {
        message: "Invalid messageId",
    }),
    conversationId: z.string().refine(isValidObjectId, {
        message: "Invalid conversationId",
    }),
})
export type MessageReadInputType = z.infer<typeof messageReadSchema>