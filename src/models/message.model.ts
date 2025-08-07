import { type Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middlewares/db.middleware"

export interface IMessageReadBy {
    _id: Types.ObjectId
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

const excludedFields = ["_id", "__v", "conversationId", "updatedAt", "deletedBy"]

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
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const retObj = ret as Record<string, any>
                excludedFields.forEach((field) => {
                    delete retObj[field]
                })
                return retObj
            },
        },
        toObject: {
            virtuals: true,
            transform: (_doc, ret) => {
                const retObj = ret as Record<string, any>
                excludedFields.forEach((field) => {
                    delete retObj[field]
                })
                return retObj
            },
        },
    }
)

SoftDeleteModelMiddleware<IMessage>(messageSchema)

messageSchema.index({ conversationId: 1, createdAt: 1 })
messageSchema.index({ "readBy.userId": 1 })

export const Message = model<IMessage, SoftDeleteModel<IMessage>>("Message", messageSchema)