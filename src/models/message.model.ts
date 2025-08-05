import { Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middleware/db.middleware"

export interface IMessageReadBy {
    userId: Types.ObjectId
    readAt: Date
}

export interface IMessage extends Document, SoftDeleteDocument {
    conversationId: Types.ObjectId
    senderId: Types.ObjectId
    content: string
    readBy: IMessageReadBy[]
    createdAt: Date
    updatedAt: Date
}

const readBySchema = new Schema<IMessageReadBy>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, required: true },
}, { _id: false })

const messageSchema = new Schema<IMessage>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: Schema.Types.String, required: true },
        readBy: { type: [readBySchema], default: [] },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
    },
    {
        timestamps: true,
    }
)

SoftDeleteModelMiddleware<IMessage>(messageSchema)

export const Message = model<IMessage, SoftDeleteModel<IMessage>>("Message", messageSchema)