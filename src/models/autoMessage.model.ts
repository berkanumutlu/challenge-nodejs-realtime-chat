import { type Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middlewares/db.middleware"

export interface IAutoMessage extends Document, SoftDeleteDocument {
    _id: Types.ObjectId
    trigger: string // e.g. "welcome", "reminder"
    content: string
    schedule: string // cron expression (e.g. "0 9 * * *")
    options?: Record<string, any>
    sendDate?: Date
    isQueued: boolean
    isSent: boolean
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const autoMessageSchema = new Schema<IAutoMessage>(
    {
        trigger: { type: Schema.Types.String, required: true, match: /^[a-z0-9_]+$/ },
        content: { type: Schema.Types.String, required: true },
        schedule: { type: Schema.Types.String, required: true },
        options: { type: Schema.Types.Mixed, default: {} },
        sendDate: { type: Date, default: null },
        isQueued: { type: Schema.Types.Boolean, default: false },
        isSent: { type: Schema.Types.Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
    },
    {
        timestamps: true,
    }
)

SoftDeleteModelMiddleware<IAutoMessage>(autoMessageSchema)

export const AutoMessage = model<IAutoMessage, SoftDeleteModel<IAutoMessage>>("AutoMessage", autoMessageSchema)