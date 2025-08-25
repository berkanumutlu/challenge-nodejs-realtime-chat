import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { validateRequestBody } from "@/middlewares/validation.middleware"

// Mock createResponse from response.middleware as it's used in validation.middleware
jest.mock("@/middlewares/response.middleware", () => ({
    createResponse: jest.fn((success, status, message, data, errors) => ({
        success,
        status,
        message,
        data,
        errors,
        date: new Date().toISOString(),
    })),
}))
import { createResponse } from "@/middlewares/response.middleware"

describe("validation.middleware", () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let nextFunction: NextFunction

    const testSchema = z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        age: z.number().min(18, "Must be at least 18"),
    })

    beforeEach(() => {
        mockRequest = { body: {} }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        nextFunction = jest.fn();
        (createResponse as jest.Mock).mockClear(); // Clear mock calls for createResponse
    })

    it("should call next() with validated data if request body is valid", () => {
        mockRequest.body = { name: "John Doe", age: 30 }
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockRequest.body).toEqual({ name: "John Doe", age: 30 })
        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith()
        expect(mockResponse.status).not.toHaveBeenCalled()
        expect(mockResponse.json).not.toHaveBeenCalled()
    })
    it("should return 400 and validation errors if request body is empty", () => {
        mockRequest.body = {}
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(400)

        // Get the actual call to see what was passed
        const actualCall = (mockResponse.json as jest.Mock).mock.calls[0][0]

        expect(actualCall).toMatchObject({
            success: false,
            status: 400,
            message: "ValidationError",
            data: null,
        })

        expect(actualCall.errors).toHaveLength(2)
        expect(actualCall.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: "name" }), expect.objectContaining({ field: "age" })]),
        )

        expect(nextFunction).not.toHaveBeenCalled()
    })
    it("should call next with ZodError if request body has invalid data", () => {
        mockRequest.body = { name: "Jo", age: 17 } // Invalid: name too short, age too low
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith(expect.any(z.ZodError))
        expect(mockResponse.status).not.toHaveBeenCalled()
        expect(mockResponse.json).not.toHaveBeenCalled()
    })
    it("should handle request body with wrong types", () => {
        mockRequest.body = { name: 123, age: "not a number" } // Wrong types
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith(expect.any(z.ZodError))
    })
    it("should pass error to next middleware if an unexpected error occurs", () => {
        const brokenSchema = z.object({
            name: z.string().transform(() => {
                throw new Error("Parsing error")
            }),
        })
        mockRequest.body = { name: "test" }
        const middleware = validateRequestBody(brokenSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(nextFunction).toHaveBeenCalledTimes(1)
        expect(nextFunction).toHaveBeenCalledWith(expect.any(Error))
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe("Parsing error")
    })
    it("should handle null body", () => {
        mockRequest.body = null
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(400)
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                status: 400,
                message: "ValidationError",
            }),
        )
    })
    it("should handle undefined body", () => {
        delete mockRequest.body
        const middleware = validateRequestBody(testSchema)
        middleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(400)
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                status: 400,
                message: "ValidationError",
            }),
        )
    })
})