import type { CryptPayloadReturnType } from "@/types/crypt"
import type { LoginInputType, RefreshTokenInputType, RegisterInputType } from "@/validations/user.validation"
import { createUser, findUserByEmail, findUserById, findUserByIdWithRefreshToken, findUserByUsername, updateUser } from "@/services/user.service"
import { CustomHttpError } from "@/errors/customHttpError"
import { compareEncryptedText, generateUserTokens, verifyRefreshToken } from "@/utils/crypt.util"

export const registerUser = async (data: RegisterInputType) => {
    const userExistsByEmail = await findUserByEmail(data.email)
    if (userExistsByEmail) throw new CustomHttpError(409, "Email already in use")

    const userExistsByUsername = await findUserByUsername(data.username)
    if (userExistsByUsername) throw new CustomHttpError(409, "Username already in use")

    return createUser(data)
}

export const loginUser = async (data: LoginInputType) => {
    const user = await findUserByEmail(data.email)
    if (!user) throw new CustomHttpError(401, "Invalid credentials")

    const isPasswordValid = await compareEncryptedText(data.password, user.password)
    if (!isPasswordValid) throw new CustomHttpError(401, "Invalid credentials")

    const { accessToken, refreshToken } = generateUserTokens(user._id.toString())
    await updateUser(user._id.toString(), { refreshToken })

    return { user, accessToken, refreshToken }
}

export const logoutUser = async (userId: string) => {
    const user = await findUserById(userId)
    if (!user) throw new CustomHttpError(404, "User not found")

    await updateUser(userId, { refreshToken: null })

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
    if (!user || user.refreshToken !== data.refreshToken) {
        throw new CustomHttpError(401, "Invalid refresh token")
    }

    const { accessToken, refreshToken } = generateUserTokens(user._id.toString())
    await updateUser(user._id.toString(), { refreshToken })

    return { accessToken, refreshToken }
}