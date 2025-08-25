import bcrypt from "bcrypt"
import jwt, { type SignOptions } from "jsonwebtoken"
import type { CryptPayloadReturnType, CryptPayloadType } from "@/types/crypt"
import { cryptConfig } from "@/config/auth.config"

export const encryptText = async (text: string, rounds: number = cryptConfig.bcrypt.saltRounds): Promise<string> => {
    const salt = await bcrypt.genSalt(rounds)
    return await bcrypt.hash(text, salt)
}

export const compareEncryptedText = async (text: string, encryptedText: string): Promise<boolean> => {
    return await bcrypt.compare(text, encryptedText)
}

export const createToken = (payload: CryptPayloadType, key: string, options?: SignOptions): string => {
    return jwt.sign(payload, key, options)
}

export const verifyToken = (token: string, key: string): CryptPayloadReturnType => {
    return jwt.verify(token, key) as CryptPayloadReturnType
}

export const verifyAccessToken = (token: string): CryptPayloadReturnType => {
    return verifyToken(token, cryptConfig.keys.access.secret.key)
}

export const verifyRefreshToken = (token: string): CryptPayloadReturnType => {
    return verifyToken(token, cryptConfig.keys.refresh.secret.key)
}

export const convertExpiresInToSeconds = (expiresIn: string): number => {
    const value = Number.parseInt(expiresIn.slice(0, -1))
    const timeUnit = expiresIn.slice(-1)

    switch (timeUnit) {
        case "s":
            return value
        case "m":
            return value * 60
        case "h":
            return value * 60 * 60
        case "d":
            return value * 24 * 60 * 60
        default:
            throw new Error(`Unsupported time unit: ${timeUnit}`)
    }
}

export const generateAccessToken = (userId: string): string => {
    return createToken({ userId }, cryptConfig.keys.access.secret.key, { expiresIn: convertExpiresInToSeconds(cryptConfig.keys.access.secret.expire) })
}

export const generateRefreshToken = (userId: string): string => {
    return createToken({ userId }, cryptConfig.keys.refresh.secret.key, { expiresIn: convertExpiresInToSeconds(cryptConfig.keys.refresh.secret.expire) })
}

export const generateUserTokens = (userId: string) => {
    const accessToken = generateAccessToken(userId)
    const refreshToken = generateRefreshToken(userId)
    return { accessToken, refreshToken }
}