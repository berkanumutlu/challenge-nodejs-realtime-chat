export class CustomHttpError extends Error {
    status: number
    errors: any[] | undefined

    constructor(status: number = 500, message: string, errors?: any[]) {
        super(message)
        this.status = status
        this.errors = errors
        Object.setPrototypeOf(this, CustomHttpError.prototype)
    }
}