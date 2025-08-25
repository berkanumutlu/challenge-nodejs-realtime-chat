import request from "supertest"
import app from "@/app"
import { User } from "@/models/user.model"
import { getRedisClient } from "@/services/redis.service"

describe("auth.integration", () => {
    let redisClient: ReturnType<typeof getRedisClient>
    const userRegisterEndpoint = "/api/auth/register"
    const userLoginEndpoint = "/api/auth/login"
    const userLogoutEndpoint = "/api/auth/logout"
    const tokenRefreshEndpoint = "/api/auth/refresh"
    const currentUserEndpoint = "/api/auth/me"

    beforeAll(async () => {
        redisClient = getRedisClient()
        // Ensure we're in test environment
        expect(process.env.NODE_ENV).toBe("test")
    })

    beforeEach(async () => {
        // Clear database and Redis before each test
        await User.deleteMany({})
        await redisClient.flushDb()
    })

    describe("POST /api/auth/register", () => {
        const validUserData = {
            username: "testuser1",
            email: "test1@example.com",
            password: "password123",
        }

        it("should register a new user successfully", async () => {
            const res = await request(app).post(userRegisterEndpoint).send(validUserData)

            expect(res.statusCode).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("User registered successfully")
            expect(res.body.data).toHaveProperty("accessToken")
            expect(res.body.data).toHaveProperty("refreshToken")

            // Verify user was created in database
            const userInDb = await User.findOne({ email: validUserData.email })
            expect(userInDb).toBeTruthy()
            expect(userInDb?.username).toBe(validUserData.username)
            expect(userInDb?.refreshToken).toBe(res.body.data.refreshToken)
        })
        it("should return 409 if email is already in use", async () => {
            // Create existing user
            await User.create({
                username: "existinguser",
                email: "existing@example.com",
                password: "hashedpassword",
            })

            const res = await request(app).post(userRegisterEndpoint).send({
                username: "anotheruser",
                email: "existing@example.com",
                password: "password123",
            })

            expect(res.statusCode).toBe(409)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Email already in use")
        })
        it("should return 409 if username is already in use", async () => {
            await User.create({
                username: "existinguser",
                email: "existing@example.com",
                password: "hashedpassword",
            })

            const res = await request(app).post(userRegisterEndpoint).send({
                username: "existinguser",
                email: "another@example.com",
                password: "password123",
            })

            expect(res.statusCode).toBe(409)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Username already in use")
        })
        it("should return 400 for invalid input", async () => {
            const res = await request(app).post(userRegisterEndpoint).send({
                username: "ab", // Too short
                email: "invalid-email", // Invalid format
                password: "123", // Too short
            })

            expect(res.statusCode).toBe(400)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("ValidationError")
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: "username" }),
                    expect.objectContaining({ field: "email" }),
                    expect.objectContaining({ field: "password" }),
                ]),
            )
        })
        it("should return 400 for empty request body", async () => {
            const res = await request(app).post(userRegisterEndpoint).send({})

            expect(res.statusCode).toBe(400)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("ValidationError")
        })
    })

    describe("POST /api/auth/login", () => {
        let testUser: any
        const userCredentials = {
            email: "login@example.com",
            password: "loginpassword",
        }

        beforeEach(async () => {
            // Create test user before each login test
            const registerRes = await request(app).post(userRegisterEndpoint).send({
                username: "loginuser",
                email: userCredentials.email,
                password: userCredentials.password,
            })

            expect(registerRes.statusCode).toBe(201)
            expect(registerRes.body.success).toBe(true)

            testUser = await User.findOne({ email: userCredentials.email })
            expect(testUser).toBeTruthy()
        })

        it("should log in an existing user successfully", async () => {
            const res = await request(app).post(userLoginEndpoint).send(userCredentials)

            expect(res.statusCode).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("User logged in successfully")
            expect(res.body.data).toHaveProperty("accessToken")
            expect(res.body.data).toHaveProperty("refreshToken")
            expect(res.body.data.user).toHaveProperty("username", "loginuser")
            expect(res.body.data.user).toHaveProperty("email", userCredentials.email)
            expect(res.body.data.user).not.toHaveProperty("password")
        })
        it("should return 401 for invalid password", async () => {
            const res = await request(app).post(userLoginEndpoint).send({
                email: userCredentials.email,
                password: "wrongpassword",
            })

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid credentials")
        })
        it("should return 401 for non-existent email", async () => {
            const res = await request(app).post(userLoginEndpoint).send({
                email: "nonexistent@example.com",
                password: "anypassword",
            })

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("User not found")
        })
        it("should return 400 for invalid input format", async () => {
            const res = await request(app).post(userLoginEndpoint).send({
                email: "invalid-email",
                password: "123", // Too short
            })

            expect(res.statusCode).toBe(400)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("ValidationError")
        })
    })

    describe("POST /api/auth/logout", () => {
        let userAccessToken: string
        let testUserId: string

        beforeEach(async () => {
            // Create and register user
            const registerRes = await request(app).post(userRegisterEndpoint).send({
                username: "logoutuser",
                email: "logout@example.com",
                password: "password123",
            })

            expect(registerRes.statusCode).toBe(201)
            expect(registerRes.body.success).toBe(true)
            expect(registerRes.body.data).toBeTruthy()
            expect(registerRes.body.data.accessToken).toBeTruthy()

            userAccessToken = registerRes.body.data.accessToken
            const user = await User.findOne({ email: "logout@example.com" })

            if (!user) {
                throw new Error("User not found after registration")
            }

            testUserId = user._id.toString()
        })

        it("should log out a user successfully and blacklist the token", async () => {
            const res = await request(app).post(userLogoutEndpoint).set("Authorization", `Bearer ${userAccessToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("User logged out successfully")

            // Verify user's refresh token is cleared
            const userInDb = await User.findById(testUserId)
            expect(userInDb?.refreshToken).toBeNull()

            // Verify token is blacklisted
            const isBlacklisted = await redisClient.get(`test_blacklist:${userAccessToken}`)
            expect(isBlacklisted).toBe("true")
        })
        it("should return 401 if no token is provided", async () => {
            const res = await request(app).post(userLogoutEndpoint)

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Token not provided")
        })
        it("should return 401 if token is blacklisted", async () => {
            // Manually blacklist the token
            await redisClient.setEx(`test_blacklist:${userAccessToken}`, 60, "true")

            const res = await request(app).post(userLogoutEndpoint).set("Authorization", `Bearer ${userAccessToken}`)

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid or expired token")
        })
    })

    describe("POST /api/auth/refresh", () => {
        let initialAccessToken: string
        let initialRefreshToken: string
        let testUserId: string

        beforeEach(async () => {
            const registerRes = await request(app).post(userRegisterEndpoint).send({
                username: "refreshuser",
                email: "refresh@example.com",
                password: "password123",
            })

            expect(registerRes.statusCode).toBe(201)
            expect(registerRes.body.success).toBe(true)

            initialAccessToken = registerRes.body.data.accessToken
            initialRefreshToken = registerRes.body.data.refreshToken
            const user = await User.findOne({ email: "refresh@example.com" })

            if (!user) {
                throw new Error("User not found after registration")
            }

            testUserId = user._id.toString()
        })

        it("should refresh access token successfully", async () => {
            // Wait a bit to ensure different timestamps in JWT
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const res = await request(app).post(tokenRefreshEndpoint).send({
                refreshToken: initialRefreshToken,
                accessToken: initialAccessToken,
            })

            expect(res.statusCode).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("Token renewed successfully")
            expect(res.body.data).toHaveProperty("accessToken")
            expect(res.body.data).toHaveProperty("refreshToken")
            expect(res.body.data.accessToken).not.toBe(initialAccessToken)
            expect(res.body.data.refreshToken).not.toBe(initialRefreshToken)

            // Verify old tokens are blacklisted
            const oldAccessTokenBlacklisted = await redisClient.get(`test_blacklist:${initialAccessToken}`)
            const oldRefreshTokenBlacklisted = await redisClient.get(`test_blacklist:${initialRefreshToken}`)
            expect(oldAccessTokenBlacklisted).toBe("true")
            expect(oldRefreshTokenBlacklisted).toBe("true")

            // Verify user's refresh token is updated
            const userInDb = await User.findById(testUserId)
            expect(userInDb?.refreshToken).toBe(res.body.data.refreshToken)
        })
        it("should return 401 for invalid refresh token", async () => {
            const res = await request(app).post(tokenRefreshEndpoint).send({ refreshToken: "invalid_refresh_token" })

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid or expired refresh token")
        })
        it("should return 401 if refresh token does not match user in DB", async () => {
            // Change user's refresh token in DB
            await User.findByIdAndUpdate(testUserId, { refreshToken: "some_other_token" })

            const res = await request(app).post(tokenRefreshEndpoint).send({ refreshToken: initialRefreshToken })

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid refresh token")
        })
        it("should return 400 for missing refresh token", async () => {
            const res = await request(app).post(tokenRefreshEndpoint).send({})

            expect(res.statusCode).toBe(400)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("ValidationError")
        })
    })

    describe("GET /api/auth/me", () => {
        let userAccessToken: string
        let testUser: any

        beforeEach(async () => {
            const registerRes = await request(app).post(userRegisterEndpoint).send({
                username: "meuser",
                email: "me@example.com",
                password: "password123",
            })

            expect(registerRes.statusCode).toBe(201)
            expect(registerRes.body.success).toBe(true)

            userAccessToken = registerRes.body.data.accessToken
            testUser = await User.findOne({ email: "me@example.com" })

            if (!testUser) {
                throw new Error("User not found after registration")
            }
        })

        it("should return current user details", async () => {
            const res = await request(app).get(currentUserEndpoint).set("Authorization", `Bearer ${userAccessToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toHaveProperty("id", testUser._id.toString())
            expect(res.body.data).toHaveProperty("username", "meuser")
            expect(res.body.data).toHaveProperty("email", "me@example.com")
            expect(res.body.data).not.toHaveProperty("password")
            expect(res.body.data).not.toHaveProperty("refreshToken")
        })
        it("should return 401 if no token is provided", async () => {
            const res = await request(app).get(currentUserEndpoint)

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Token not provided")
        })
        it("should return 401 if token is invalid", async () => {
            const res = await request(app).get(currentUserEndpoint).set("Authorization", "Bearer invalid_token")

            expect(res.statusCode).toBe(401)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid token")
        })
    })

    describe("Rate Limiting", () => {
        it("should be disabled in test environment", async () => {
            // In test environment, rate limiting should be disabled
            // So we can make multiple requests without being rate limited
            const testUser = {
                username: "ratelimituser",
                email: "ratelimit@example.com",
                password: "password123",
            }

            // Create user first
            const registerRes = await request(app).post(userRegisterEndpoint).send(testUser)
            expect(registerRes.statusCode).toBe(201)

            // Make multiple login requests - should not be rate limited in test env
            for (let i = 0; i < 15; i++) {
                const res = await request(app).post(userLoginEndpoint).send(testUser)
                expect(res.statusCode).toBe(200) // Should succeed every time in test env
            }
        })
    })
})