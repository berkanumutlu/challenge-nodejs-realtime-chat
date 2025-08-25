import type { Response, NextFunction } from "express"
import { Types } from "mongoose"
import { IAuthenticatedRequest } from "@/types/request"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { findUserById } from "@/services/user.service"
import { isTokenBlacklisted } from "@/services/auth.service"
import { CustomHttpError } from "@/errors/customHttpError"
import { verifyAccessToken } from "@/utils/crypt.util"

// Mock external dependencies
jest.mock("@/services/user.service")
jest.mock("@/services/auth.service")
jest.mock("@/utils/crypt.util")

describe("auth.middleware", () => {
    let mockRequest: Partial<IAuthenticatedRequest>
    let mockResponse: Partial<Response>
    let nextFunction: NextFunction

    const mockUser = {
        id: new Types.ObjectId().toString(),
        username: "testuser",
        email: "test@example.com",
        toObject: () => ({ id: mockUser.id, username: mockUser.username, email: mockUser.email }),
    }
    const mockToken = "valid_jwt_token"
    const mockDecodedPayload = { userId: mockUser.id }

    beforeEach(() => {
        mockRequest = {
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        }
        mockResponse = {
            warning: jest.fn(),
        }
        nextFunction = jest.fn()

        jest.clearAllMocks();
        (findUserById as jest.Mock).mockResolvedValue(mockUser);
        (isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
        (verifyAccessToken as jest.Mock).mockReturnValue(mockDecodedPayload);
    })

    it("should call next() and set req.user and req.token if authentication is successful", async () => {
        await authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction)

        expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken)
        expect(verifyAccessToken).toHaveBeenCalledWith(mockToken)
        expect(findUserById).toHaveBeenCalledWith(mockUser.id)
        expect(mockRequest.user).toEqual(mockUser)
        expect(mockRequest.token).toBe(mockToken)
        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith()
        expect(mockResponse.warning).not.toHaveBeenCalled()
    })
    it("should throw CustomHttpError if token is not provided", async () => {
        mockRequest.headers = {} // No authorization header

        await expect(
            authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow(CustomHttpError)

        await expect(
            authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow("Token not provided")

        expect(isTokenBlacklisted).not.toHaveBeenCalled()
        expect(nextFunction).not.toHaveBeenCalled()
    })
    it("should throw CustomHttpError if token is blacklisted", async () => {
        (isTokenBlacklisted as jest.Mock).mockResolvedValue(true);

        await expect(
            authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow(CustomHttpError)

        await expect(
            authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow("Invalid or expired token")

        expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken)
        expect(verifyAccessToken).not.toHaveBeenCalled()
        expect(nextFunction).not.toHaveBeenCalled()
    })
    it("should call next with error if token verification fails", async () => {
        const jwtError = new Error("Invalid token");
        (verifyAccessToken as jest.Mock).mockImplementation(() => {
            throw jwtError
        });

        await authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction)

        expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken)
        expect(verifyAccessToken).toHaveBeenCalledWith(mockToken)
        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith(jwtError)
        expect(findUserById).not.toHaveBeenCalled()
    })
    it("should call res.warning if user is not found", async () => {
        (findUserById as jest.Mock).mockResolvedValue(null);

        await authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction)

        expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken)
        expect(verifyAccessToken).toHaveBeenCalledWith(mockToken)
        expect(findUserById).toHaveBeenCalledWith(mockUser.id)
        expect(mockResponse.warning).toHaveBeenCalledWith("User not found", 404)
        expect(mockRequest.user).toBeUndefined()
        expect(nextFunction).not.toHaveBeenCalled()
    })
    it("should call next with error if an unexpected error occurs", async () => {
        const genericError = new Error("Something unexpected happened");
        (isTokenBlacklisted as jest.Mock).mockRejectedValue(genericError);

        await expect(
            authenticatedMiddleware(mockRequest as IAuthenticatedRequest, mockResponse as Response, nextFunction),
        ).rejects.toThrow("Something unexpected happened")

        expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken)
        expect(verifyAccessToken).not.toHaveBeenCalled()
        expect(nextFunction).not.toHaveBeenCalled()
    })
})