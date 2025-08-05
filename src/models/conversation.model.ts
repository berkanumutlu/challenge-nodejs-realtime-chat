import { Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middleware/db.middleware"

export interface IConversation extends Document, SoftDeleteDocument {
    participants: Types.ObjectId[]
    lastMessageId?: Types.ObjectId
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const conversationSchema = new Schema<IConversation>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        lastMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
    },
    {
        timestamps: true,
    }
)

SoftDeleteModelMiddleware<IConversation>(conversationSchema)

export const Conversation = model<IConversation, SoftDeleteModel<IConversation>>("Conversation", conversationSchema)