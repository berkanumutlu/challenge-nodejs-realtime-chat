import xss from "xss"
import { type ZodSchema } from "zod"

interface ISanitizeAndValidateResult<T> {
    success: boolean
    data?: T
    error?: string
}

export const sanitizeAndValidateText = <T extends string>(
    content: string,
    schema: ZodSchema<T>,
): ISanitizeAndValidateResult<T> => {
    const validationResult = schema.safeParse(content)

    if (!validationResult.success) {
        return {
            success: false,
            error: validationResult.error.issues[0]?.message || "Invalid content format",
        }
    }

    const sanitizedContent = xss(validationResult.data)

    if (!sanitizedContent || sanitizedContent.trim() === "") {
        return {
            success: false,
            error: "Content cannot be empty after sanitization",
        }
    }

    return {
        success: true,
        data: sanitizedContent as T,
    }
}