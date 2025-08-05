import type { Request } from "express"

export interface IAuthenticatedRequest extends Request {
    user?: IUser
    token?: string
}