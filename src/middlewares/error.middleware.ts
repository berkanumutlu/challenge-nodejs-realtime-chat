import type { Request, Response, NextFunction } from "express"
import { appConfig } from "@/config/app.config"
import { CustomHttpError } from "@/errors/customHttpError"

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
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

    return res.status(500).json({
        success: false,
        status: 500,
        message: err.message || "Internal server error",
        data: null,
        errors,
        date: new Date().toISOString(),
    })
}