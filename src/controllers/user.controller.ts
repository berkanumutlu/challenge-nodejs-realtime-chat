import type { Response, NextFunction } from "express"
import type { IAuthenticatedRequest } from "@/types/request"
import { userIdParamSchema } from "@/validations/user.validation"
import { findAllUsers, getOnlineUsersCount, getPaginatedOnlineUsers, isUserOnline, updateUserRecord } from "@/services/user.service"
import { createPaginatedResponseData } from "@/utils/response.util"

export const getUserList = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const limit = Number.parseInt(req.query?.limit as string) || 10
        const offset = Number.parseInt(req.query?.offset as string) || 0
        const query = {
            _id: { $ne: req.user.id },
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
        const updatedUser = await updateUserRecord(req.user.id, req.body)

        res.success(updatedUser?.toObject(), "User updated successfully")
    } catch (error) {
        next(error)
    }
}

export const getOnlineUserList = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const limit = Number.parseInt(req.query?.limit as string) || 0
        const offset = Number.parseInt(req.query?.offset as string) || 0
        const { users, total } = await getPaginatedOnlineUsers(limit, offset)

        res.success(createPaginatedResponseData(users, total, limit, offset))
    } catch (error) {
        next(error)
    }
}

export const getOnlineUserCount = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const count = await getOnlineUsersCount()

        res.success({ count })
    } catch (error) {
        next(error)
    }
}

export const getIsUserOnline = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = userIdParamSchema.parse(req.params)
        const onlineStatus = await isUserOnline(userId)

        res.success({ userId, isOnline: onlineStatus })
    } catch (error) {
        next(error)
    }
}