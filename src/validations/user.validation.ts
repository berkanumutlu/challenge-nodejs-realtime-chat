import { z } from "zod"

export const registerSchema = z.object({
    email: z.email("Invalid email"),
    username: z.string("Username is required").min(3, "Username must be at least 3 characters"),
    password: z.string("Password is required").min(6, "Password must be at least 6 characters"),
})
export type RegisterInputType = z.infer<typeof registerSchema>

export const loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string("Password is required").min(6, "Password must be at least 6 characters")
})
export type LoginInputType = z.infer<typeof loginSchema>

export const refreshTokenSchema = z.object({
    refreshToken: z.string("RefreshToken is required").min(1, "RefreshToken is required"),
})
export type RefreshTokenInputType = z.infer<typeof refreshTokenSchema>