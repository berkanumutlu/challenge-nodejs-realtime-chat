import type { Response, NextFunction } from "express"
import type { IAuthenticatedRequest } from "@/types/request"
import { findAllUsers, updateUserRecord } from "@/services/user.service"
import { createPaginatedResponseData } from "@/utils/response.util"

export const getUserList = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const limit = Number.parseInt(req.query.limit as string) || 10
        const offset = Number.parseInt(req.query.offset as string) || 0
        const query = {
            _id: { $ne: req.user._id },
            isActive: true,
        }
        const { users, total } = await findAllUsers(query, limit, offset)

        res.success(createPaginatedResponseData(users, total, limit, offset))
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const updatedUser = await updateUserRecord(req.user._id.toString(), req.body)

        res.success(updatedUser?.toObject(), "User updated successfully")
    } catch (error) {
        next(error)
    }
}