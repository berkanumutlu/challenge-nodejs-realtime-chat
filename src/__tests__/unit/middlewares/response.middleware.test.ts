import type { Request, Response, NextFunction } from "express"
import { responseHandler, createResponse } from "@/middlewares/response.middleware"

describe("response.middleware", () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let nextFunction: NextFunction

    beforeEach(() => {
        mockRequest = {}
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        nextFunction = jest.fn()
    })

    describe("createResponse", () => {
        it("should create a success response object", () => {
            const data = { key: "value" }
            const message = "Operation successful"
            const status = 200
            const response = createResponse(true, status, message, data)

            expect(response.success).toBe(true)
            expect(response.status).toBe(status)
            expect(response.message).toBe(message)
            expect(response.data).toEqual(data)
            expect(response.errors).toBeNull()
            expect(response.date).toBeDefined()
        })
        it("should create an error response object", () => {
            const message = "Operation failed"
            const status = 400
            const errors = [{ field: "name", message: "Name is required" }]
            const response = createResponse(false, status, message, null, errors)

            expect(response.success).toBe(false)
            expect(response.status).toBe(status)
            expect(response.message).toBe(message)
            expect(response.data).toBeNull()
            expect(response.errors).toEqual(errors)
            expect(response.date).toBeDefined()
        })
        it("should use default values for optional parameters", () => {
            const response = createResponse(true, 200, null)
            expect(response.data).toBeNull()
            expect(response.errors).toBeNull()
        })
    })
    describe("responseHandler", () => {
        it("should add success and warning methods to response object", () => {
            responseHandler(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.success).toBeDefined()
            expect(mockResponse.warning).toBeDefined()
            expect(nextFunction).toHaveBeenCalledTimes(1)
        })
        it("success method should send a 200 success response by default", () => {
            responseHandler(mockRequest as Request, mockResponse as Response, nextFunction)
            const data = { user: "test" };
            (mockResponse.success as jest.Mock)(data);

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    status: 200,
                    message: "Success",
                    data: data,
                })
            )
        })
        it("success method should send a custom status and message", () => {
            responseHandler(mockRequest as Request, mockResponse as Response, nextFunction)
            const data = { user: "created" };
            (mockResponse.success as jest.Mock)(data, "User created", 201);

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    status: 201,
                    message: "User created",
                    data: data,
                })
            )
        })
        it("warning method should send a 200 warning response by default", () => {
            responseHandler(mockRequest as Request, mockResponse as Response, nextFunction);
            (mockResponse.warning as jest.Mock)();

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    status: 200,
                    message: "Warning",
                    data: null,
                })
            )
        })
        it("warning method should send a custom status and message", () => {
            responseHandler(mockRequest as Request, mockResponse as Response, nextFunction);
            (mockResponse.warning as jest.Mock)("Something went wrong", 404);

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    status: 404,
                    message: "Something went wrong",
                    data: null,
                })
            )
        })
    })
})