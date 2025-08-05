import type { Request, Response, NextFunction } from "express"

const createResponse = (
    success: boolean,
    status: number,
    message: string | null,
    data: any = null,
    errors: any = null,
) => {
    return {
        success,
        status,
        message,
        data,
        errors,
        date: new Date().toISOString(),
    }
}

export const responseHandler = (req: Request, res: Response, next: NextFunction) => {
    res.success = (data: any, message = "Success", status = 200): void => {
        res.status(status).json(createResponse(true, status, message, data))
    }

    res.warning = (message = "Warning", status = 200): void => {
        res.status(status).json(createResponse(false, status, message))
    }

    next()
}