import type { Response, NextFunction } from "express"
import type { IAuthenticatedRequest } from "@/types/request"
import { findUserById } from "@/services/user.service"
import { isTokenBlacklisted } from "@/services/auth.service"
import { CustomHttpError } from "@/errors/customHttpError"
import { verifyAccessToken } from "@/utils/crypt.util"

export const authenticatedMiddleware = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.replace('Bearer ', '')
    if (!token) throw new CustomHttpError(401, "Token not provided")

    const isBlacklistedToken = await isTokenBlacklisted(token)
    if (isBlacklistedToken) throw new CustomHttpError(401, "Invalid or expired token")

    try {
        const decoded = verifyAccessToken(token)

        const user = await findUserById(decoded.userId)
        if (!user) return res.warning("User not found", 404)

        req.user = user
        req.token = token

        next()
    } catch (error) {
        next(error)
    }
}