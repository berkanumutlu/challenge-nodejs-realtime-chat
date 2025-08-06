import type { Request, Response, NextFunction } from "express"

export const createResponse = (
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
    res.success = (data: any, message: string = "Success", status: number = 200): void => {
        res.status(status).json(createResponse(true, status, message, data))
    }

    res.warning = (message: string = "Warning", status: number = 200): void => {
        res.status(status).json(createResponse(false, status, message))
    }

    next()
}