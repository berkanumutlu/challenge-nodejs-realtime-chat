import "express"

declare module "express-serve-static-core" {
    interface Response {
        success: (data: any, message?: string, status?: number) => void
        warning: (message?: string, status?: number) => void
    }
}