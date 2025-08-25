import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { cryptConfig } from "@/config/auth.config"
import { encryptText, compareEncryptedText, createToken, verifyToken, convertExpiresInToSeconds, generateAccessToken, generateRefreshToken, generateUserTokens, verifyAccessToken, verifyRefreshToken } from "@/utils/crypt.util"

// Mock bcrypt and jsonwebtoken
jest.mock("bcrypt")
jest.mock("jsonwebtoken")

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockedJwt = jwt as jest.Mocked<typeof jwt>

describe("crypt.util", () => {
    const testUserId = "60d5ec49f8c7a7001c8e4d5a"
    const testSecret = "test_secret_key"
    const testExpiresIn = "1h"

    beforeEach(() => {
        jest.clearAllMocks();

        // Ensure cryptConfig has test values
        cryptConfig.keys.access.secret.key = "test_access_secret"
        cryptConfig.keys.access.secret.expire = "1h"
        cryptConfig.keys.refresh.secret.key = "test_refresh_secret"
        cryptConfig.keys.refresh.secret.expire = "7d"
        cryptConfig.bcrypt.saltRounds = 10
    })

    describe("encryptText", () => {
        it("should encrypt text successfully", async () => {
            mockedBcrypt.genSalt.mockResolvedValue("mockSalt" as never)
            mockedBcrypt.hash.mockResolvedValue("hashedText" as never)

            const result = await encryptText("password123")

            expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10)
            expect(mockedBcrypt.hash).toHaveBeenCalledWith("password123", "mockSalt")
            expect(result).toBe("hashedText")
        })
        it("should use custom salt rounds", async () => {
            mockedBcrypt.genSalt.mockResolvedValue("mockSalt" as never)
            mockedBcrypt.hash.mockResolvedValue("hashedText" as never)

            await encryptText("password123", 12)

            expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12)
        })
    })
    describe("compareEncryptedText", () => {
        it("should return true for matching text and hash", async () => {
            mockedBcrypt.compare.mockResolvedValue(true as never)

            const result = await compareEncryptedText("password123", "hashedText")

            expect(mockedBcrypt.compare).toHaveBeenCalledWith("password123", "hashedText")
            expect(result).toBe(true)
        })
        it("should return false for non-matching text and hash", async () => {
            mockedBcrypt.compare.mockResolvedValue(false as never)

            const result = await compareEncryptedText("wrongPassword", "hashedText")

            expect(mockedBcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedText")
            expect(result).toBe(false)
        })
    })
    describe("createToken", () => {
        it("should create a JWT token", () => {
            mockedJwt.sign.mockReturnValue("mockToken" as never)

            const token = createToken({ userId: testUserId }, testSecret, { expiresIn: testExpiresIn })

            expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: testUserId }, testSecret, { expiresIn: testExpiresIn })
            expect(token).toBe("mockToken")
        })
        it("should create token without options", () => {
            mockedJwt.sign.mockReturnValue("mockToken" as never)

            const token = createToken({ userId: testUserId }, testSecret)

            expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: testUserId }, testSecret, undefined)
            expect(token).toBe("mockToken")
        })
    })
    describe("verifyToken", () => {
        it("should verify a JWT token and return payload", () => {
            const mockPayload = { userId: testUserId }
            mockedJwt.verify.mockReturnValue(mockPayload as never)

            const payload = verifyToken("mockToken", testSecret)

            expect(mockedJwt.verify).toHaveBeenCalledWith("mockToken", testSecret)
            expect(payload).toEqual(mockPayload)
        })
        it("should throw JsonWebTokenError for invalid token", () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new jwt.JsonWebTokenError("invalid token")
            })

            expect(() => verifyToken("invalidToken", testSecret)).toThrow(jwt.JsonWebTokenError)
        })
        it("should throw TokenExpiredError", () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new jwt.TokenExpiredError("jwt expired", new Date())
            })

            expect(() => verifyToken("expiredToken", testSecret)).toThrow(jwt.TokenExpiredError)
        })
        it("should throw NotBeforeError", () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new jwt.NotBeforeError("jwt not active", new Date())
            })

            expect(() => verifyToken("notActiveToken", testSecret)).toThrow(jwt.NotBeforeError)
        })
    })
    describe("convertExpiresInToSeconds", () => {
        it("should convert seconds correctly", () => {
            expect(convertExpiresInToSeconds("30s")).toBe(30)
            expect(convertExpiresInToSeconds("0s")).toBe(0)
        })
        it("should convert minutes correctly", () => {
            expect(convertExpiresInToSeconds("5m")).toBe(300)
            expect(convertExpiresInToSeconds("1m")).toBe(60)
        })
        it("should convert hours correctly", () => {
            expect(convertExpiresInToSeconds("2h")).toBe(7200)
            expect(convertExpiresInToSeconds("1h")).toBe(3600)
        })
        it("should convert days correctly", () => {
            expect(convertExpiresInToSeconds("1d")).toBe(86400)
            expect(convertExpiresInToSeconds("7d")).toBe(604800)
        })
        it("should throw error for unsupported time unit", () => {
            expect(() => convertExpiresInToSeconds("1y")).toThrow("Unsupported time unit: y")
            expect(() => convertExpiresInToSeconds("1w")).toThrow("Unsupported time unit: w")
        })
        it("should handle edge cases", () => {
            expect(() => convertExpiresInToSeconds("")).toThrow()
            expect(() => convertExpiresInToSeconds("abc")).toThrow()
        })
    })
    describe("generateAccessToken", () => {
        it("should generate an access token", () => {
            mockedJwt.sign.mockReturnValue("mockAccessToken" as never)

            const token = generateAccessToken(testUserId)

            expect(mockedJwt.sign).toHaveBeenCalledWith(
                { userId: testUserId },
                "test_access_secret",
                { expiresIn: 3600 }, // 1h = 3600 seconds
            )
            expect(token).toBe("mockAccessToken")
        })
    })
    describe("generateRefreshToken", () => {
        it("should generate a refresh token", () => {
            mockedJwt.sign.mockReturnValue("mockRefreshToken" as never)

            const token = generateRefreshToken(testUserId)

            expect(mockedJwt.sign).toHaveBeenCalledWith(
                { userId: testUserId },
                "test_refresh_secret",
                { expiresIn: 604800 }, // 7d = 604800 seconds
            )
            expect(token).toBe("mockRefreshToken")
        })
    })
    describe("generateUserTokens", () => {
        it("should generate both access and refresh tokens", () => {
            mockedJwt.sign.mockReturnValueOnce("mockAccessToken" as never).mockReturnValueOnce("mockRefreshToken" as never)

            const tokens = generateUserTokens(testUserId)

            expect(tokens).toEqual({
                accessToken: "mockAccessToken",
                refreshToken: "mockRefreshToken",
            })
            expect(mockedJwt.sign).toHaveBeenCalledTimes(2)
        })
    })
    describe("verifyAccessToken", () => {
        it("should verify an access token", () => {
            const mockPayload = { userId: testUserId }
            mockedJwt.verify.mockReturnValue(mockPayload as never)

            const payload = verifyAccessToken("mockAccessToken")

            expect(mockedJwt.verify).toHaveBeenCalledWith("mockAccessToken", "test_access_secret")
            expect(payload).toEqual(mockPayload)
        })
    })
    describe("verifyRefreshToken", () => {
        it("should verify a refresh token", () => {
            const mockPayload = { userId: testUserId }
            mockedJwt.verify.mockReturnValue(mockPayload as never)

            const payload = verifyRefreshToken("mockRefreshToken")

            expect(mockedJwt.verify).toHaveBeenCalledWith("mockRefreshToken", "test_refresh_secret")
            expect(payload).toEqual(mockPayload)
        })
    })
})