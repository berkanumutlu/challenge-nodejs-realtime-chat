import { Document, model, Schema } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middlewares/db.middleware"

export interface IUser extends Document, SoftDeleteDocument {
    username: string
    email: string
    password: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const userSchema = new Schema<IUser>(
    {
        username: { type: Schema.Types.String, required: true, unique: true, trim: true, match: /^[a-zA-Z0-9]+$/ },
        email: { type: Schema.Types.String, required: true, unique: true, match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'], },
        password: { type: Schema.Types.String, required: true },
        isActive: { type: Schema.Types.Boolean, default: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    {
        timestamps: true,
    }
)

SoftDeleteModelMiddleware<IUser>(userSchema)

export const User = model<IUser, SoftDeleteModel<IUser>>("User", userSchema)