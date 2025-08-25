import { z } from "zod"
import xss from "xss"
import { sanitizeAndValidateText } from "@/utils/text.util"

// Mock xss
jest.mock("xss")
const mockedXss = xss as jest.MockedFunction<typeof xss>

describe("text.util", () => {
    const mockSchema = z.string().min(5).max(100)

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock: xss returns input unchanged for valid content
        mockedXss.mockImplementation((input) => input)
    })

    it("should return success true and sanitized data for valid input", () => {
        const content = "Hello, world!"
        mockedXss.mockReturnValue("Hello, world!")

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(true)
        expect(result.data).toBe("Hello, world!")
        expect(result.error).toBeUndefined()
        expect(mockedXss).toHaveBeenCalledWith(content)
    })
    it("should sanitize XSS content", () => {
        const content = 'Hello <script>alert("xss")</script> World!'
        const sanitizedContent = "Hello &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; World!"
        mockedXss.mockReturnValue(sanitizedContent)

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(true)
        expect(result.data).toBe(sanitizedContent)
        expect(mockedXss).toHaveBeenCalledWith(content)
    })
    it("should return success false for input too short", () => {
        const content = "abc" // Too short for min(5)

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Too small: expected string to have >=5 characters")
        expect(result.data).toBeUndefined()
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should return success false for input too long", () => {
        const content = "a".repeat(101) // Too long for max(100)

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Too big: expected string to have <=100 characters")
        expect(result.data).toBeUndefined()
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should return success false if content is empty after sanitization", () => {
        const content = "valid content"
        mockedXss.mockReturnValue("   ")

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Content cannot be empty after sanitization")
        expect(result.data).toBeUndefined()
        expect(mockedXss).toHaveBeenCalledWith(content)
    })
    it("should return success false for content with only spaces (validation fails)", () => {
        const content = "   " // Only spaces

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Too small: expected string to have >=5 characters")
        expect(result.data).toBeUndefined()
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should return success false if content becomes empty string after sanitization", () => {
        const content = '<script>alert("xss")</script>'
        mockedXss.mockReturnValue("") // xss removes all content

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Content cannot be empty after sanitization")
        expect(result.data).toBeUndefined()
        expect(mockedXss).toHaveBeenCalledWith(content)
    })
    it("should return success false for non-string input", () => {
        const content = 123 as any // Invalid type

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Invalid input: expected string, received number")
        expect(result.data).toBeUndefined()
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should handle null input", () => {
        const content = null as any

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Invalid input: expected string, received null")
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should handle undefined input", () => {
        const content = undefined as any

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Invalid input: expected string, received undefined")
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should handle complex validation schema", () => {
        const emailSchema = z.string().email()
        const content = "not-an-email"

        const result = sanitizeAndValidateText(content, emailSchema)

        expect(result.success).toBe(false)
        expect(result.error).toBe("Invalid email address")
        expect(mockedXss).not.toHaveBeenCalled()
    })
    it("should sanitize and validate successfully with complex content", () => {
        const content = "Hello <b>world</b>! This is a test message."
        const sanitizedContent = "Hello &lt;b&gt;world&lt;/b&gt;! This is a test message."
        mockedXss.mockReturnValue(sanitizedContent)

        const result = sanitizeAndValidateText(content, mockSchema)

        expect(result.success).toBe(true)
        expect(result.data).toBe(sanitizedContent)
        expect(mockedXss).toHaveBeenCalledWith(content)
    })
})