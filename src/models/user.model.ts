import { type Document, model, Schema, Types } from "mongoose"
import { SoftDeleteModelMiddleware, type SoftDeleteDocument, type SoftDeleteModel } from "@/middlewares/db.middleware"
import { encryptText } from "@/utils/crypt.util"

export interface IUser extends Document, SoftDeleteDocument {
    _id: Types.ObjectId
    username: string
    email: string
    password: string
    refreshToken?: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const excludedFields = ["_id", "__v", "password", "refreshToken", "isActive", "updatedAt", "deletedAt", "deletedBy"]

const userSchema = new Schema<IUser>(
    {
        username: { type: Schema.Types.String, required: true, unique: true, trim: true, match: /^[a-zA-Z0-9]+$/ },
        email: { type: Schema.Types.String, required: true, unique: true, match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'], },
        password: { type: Schema.Types.String, required: true },
        refreshToken: { type: Schema.Types.String, default: null },
        isActive: { type: Schema.Types.Boolean, default: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
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

SoftDeleteModelMiddleware<IUser>(userSchema)

// Before create
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await encryptText(this.password)
    }
    next()
})

// Before update
userSchema.pre("findOneAndUpdate", async function (next) {
    const updatedFields = this.getUpdate() as any
    if (updatedFields?.password) {
        updatedFields.password = await encryptText(updatedFields.password)
    }
    next()
})

export const User = model<IUser, SoftDeleteModel<IUser>>("User", userSchema)