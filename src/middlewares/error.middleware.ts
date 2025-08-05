import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken"
import { appConfig } from "@/config/app.config"
import { createResponse } from "@/middlewares/response.middleware"
import { CustomHttpError } from "@/errors/customHttpError"

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message
        }))
        return res.status(400).json(createResponse(false, 400, "Validation failed", null, errors))
    }

    if (err instanceof JsonWebTokenError) {
        return res.warning("Invalid token", 401)
    }

    if (err instanceof TokenExpiredError) {
        return res.warning("Token expired", 401)
    }

    if (err instanceof CustomHttpError) {
        return res.warning(err.message, err.status)
    }

    let errors = err;
    if (appConfig.env === "production") {
        let errorMessages: { message: string }[] = [];
        if (err.errors) {
            err.errors.forEach((error: { message: string }) => errorMessages.push({ message: error.message }));
        } else {
            errorMessages.push({ message: err.message });
        }
        errors = errorMessages;
    }

    return res.status(500).json(createResponse(false, 500, err.message || "Internal server error", null, errors))
}