import type { Request, Response, NextFunction } from "express"
import type { IAuthenticatedRequest } from "@/types/request"
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "@/services/auth.service"

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const responseData = await registerUser(req.body)

        res.success(responseData, "User registered successfully", 201)
    } catch (error) {
        next(error)
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user, ...restData } = await loginUser(req.body)

        res.success({ user: user.toObject(), ...restData }, "User logged in successfully")
    } catch (error) {
        next(error)
    }
}

export const logout = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.warning("Unauthorized", 401)

        await logoutUser(req.user._id.toString())

        res.success(null, "User logged out successfully")
    } catch (error) {
        next(error)
    }
}

export const me = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.warning("Unauthorized", 401)

        res.success(req.user.toObject())
    } catch (error) {
        next(error)
    }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const responseData = await refreshAccessToken(req.body)

        res.success(responseData, "Token renewed successfully")
    } catch (error) {
        next(error)
    }
}