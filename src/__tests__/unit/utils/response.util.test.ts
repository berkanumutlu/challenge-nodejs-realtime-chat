import { createPaginatedResponseData } from "@/utils/response.util"

describe("response.util", () => {
    it("should return correct pagination metadata when limit and offset are provided", () => {
        const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
        const total = 10
        const limit = 3
        const offset = 3 // Second page

        const result = createPaginatedResponseData(data, total, limit, offset)

        expect(result).toEqual({
            meta: {
                perPage: 3,
                currentPage: 2,
                lastPage: 4,
                total: 10,
            },
            items: data,
        })
    })
    it("should handle empty data array correctly", () => {
        const data: any[] = []
        const total = 0
        const limit = 10
        const offset = 0

        const result = createPaginatedResponseData(data, total, limit, offset)

        expect(result).toEqual({
            meta: {
                perPage: 10,
                currentPage: 1,
                lastPage: 0,
                total: 0,
            },
            items: [],
        })
    })
    it("should default to currentPage 1 and lastPage 1 if limit is 0", () => {
        const data = [{ id: 1 }, { id: 2 }]
        const total = 2
        const limit = 0 // No limit, all items
        const offset = 0

        const result = createPaginatedResponseData(data, total, limit, offset)

        expect(result).toEqual({
            meta: {
                perPage: 0,
                currentPage: 1,
                lastPage: 1,
                total: 2,
            },
            items: data,
        })
    })
    it("should calculate total from data length if totalParam is not provided", () => {
        const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
        const limit = 2
        const offset = 0

        const result = createPaginatedResponseData(data, undefined, limit, offset)

        expect(result.meta.total).toBe(3)
        expect(result.meta.lastPage).toBe(2) // ceil(3/2) = 2
    })
    it("should handle offset that exceeds total items", () => {
        const data: any[] = []
        const total = 5
        const limit = 2
        const offset = 10 // Beyond total

        const result = createPaginatedResponseData(data, total, limit, offset)

        expect(result.meta.currentPage).toBe(6) // floor(10/2) + 1
        expect(result.meta.lastPage).toBe(3) // ceil(5/2) = 3
        expect(result.items).toEqual([])
    })
})