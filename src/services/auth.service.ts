import type { CryptPayloadReturnType } from "@/types/crypt"
import { cryptConfig } from "@/config/auth.config"
import { redisConfig } from "@/config/redis.config"
import type { LoginInputType, RefreshTokenInputType, RegisterInputType } from "@/validations/user.validation"
import { createUser, findUserByEmail, findUserById, findUserByIdWithRefreshToken, findUserByUsername, updateUserRecord } from "@/services/user.service"
import { getRedisClient } from "@/services/redis.service"
import { CustomHttpError } from "@/errors/customHttpError"
import { compareEncryptedText, convertExpiresInToSeconds, generateUserTokens, verifyRefreshToken } from "@/utils/crypt.util"

export const addTokenToBlacklist = async (token: string, expiresInSeconds: number) => {
    const client = getRedisClient()
    await client.setEx(`${redisConfig.blacklistPrefix}${token}`, expiresInSeconds, "true")
}

const addAccessTokenToBlacklist = async (token: string) => {
    return addTokenToBlacklist(token, convertExpiresInToSeconds(cryptConfig.keys.access.secret.expire))
}

const addRefreshTokenToBlacklist = async (token: string) => {
    return addTokenToBlacklist(token, convertExpiresInToSeconds(cryptConfig.keys.refresh.secret.expire))
}

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
    const client = getRedisClient()
    const result = await client.get(`${redisConfig.blacklistPrefix}${token}`)
    return result === "true"
}

export const registerUser = async (data: RegisterInputType) => {
    const userExistsByEmail = await findUserByEmail(data.email)
    if (userExistsByEmail) throw new CustomHttpError(409, "Email already in use")

    const userExistsByUsername = await findUserByUsername(data.username)
    if (userExistsByUsername) throw new CustomHttpError(409, "Username already in use")

    const user = await createUser(data)

    const { accessToken, refreshToken } = generateUserTokens(user.id)
    await updateUserRecord(user.id, { refreshToken })

    return { accessToken, refreshToken }
}

export const loginUser = async (data: LoginInputType) => {
    const user = await findUserByEmail(data.email)
    if (!user) throw new CustomHttpError(401, "User not found")

    const isPasswordValid = await compareEncryptedText(data.password, user.password)
    if (!isPasswordValid) throw new CustomHttpError(401, "Invalid credentials")

    const { accessToken, refreshToken } = generateUserTokens(user.id)
    await updateUserRecord(user.id, { refreshToken })

    return { user, accessToken, refreshToken }
}

export const logoutUser = async (userId: string, accessToken: string) => {
    const user = await findUserById(userId)
    if (!user) throw new CustomHttpError(404, "User not found")

    await updateUserRecord(userId, { refreshToken: null })

    addAccessTokenToBlacklist(accessToken)

    return true
}

export const refreshAccessToken = async (data: RefreshTokenInputType) => {
    let decoded: CryptPayloadReturnType
    try {
        decoded = verifyRefreshToken(data.refreshToken)
    } catch (error) {
        throw new CustomHttpError(401, "Invalid or expired refresh token")
    }

    const user = await findUserByIdWithRefreshToken(decoded.userId)
    if (!user || user.refreshToken !== data.refreshToken) throw new CustomHttpError(401, "Invalid refresh token")

    addRefreshTokenToBlacklist(data.refreshToken)
    if (data?.accessToken) {
        addAccessTokenToBlacklist(data?.accessToken)
    }

    const { accessToken, refreshToken } = generateUserTokens(user.id)
    await updateUserRecord(user.id, { refreshToken })

    return { accessToken, refreshToken }
}