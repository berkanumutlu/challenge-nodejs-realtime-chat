import { type Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middlewares/db.middleware"

export interface IConversation extends Document, SoftDeleteDocument {
    _id: Types.ObjectId
    participants: Types.ObjectId[]
    lastMessageId?: Types.ObjectId
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const excludedFields = ["_id", "__v", "createdBy", "updatedAt", "deletedAt", "deletedBy"]

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

SoftDeleteModelMiddleware<IConversation>(conversationSchema)

export const Conversation = model<IConversation, SoftDeleteModel<IConversation>>("Conversation", conversationSchema)