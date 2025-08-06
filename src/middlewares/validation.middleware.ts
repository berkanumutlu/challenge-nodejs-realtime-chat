import type { Request, Response, NextFunction } from "express"
import { ZodError, type ZodSchema } from "zod"
import { createResponse } from "@/middlewares/response.middleware"

interface IValidationError {
    field: string
    message: string
}

// Zod validation middleware
export const validateRequestBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                const errors = getRequiredFieldErrors(schema)
                return res.status(400).json(createResponse(false, 400, "Validation failed", null, errors))
            }

            const validatedData = schema.parse(req.body)
            req.body = validatedData
            next()
        } catch (error) {
            next(error)
        }
    }
}

const getRequiredFieldErrors = (schema: ZodSchema): IValidationError[] => {
    try {
        schema.parse({})
    } catch (error) {
        if (error instanceof ZodError) {
            return error.issues.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }))
        }
    }

    return []
}