import type { PaginatedResponseType } from "@/types/response"

export const createPaginatedResponseData = (data: any, totalParam?: number, limit = 0, offset = 0): PaginatedResponseType => {
    const total = totalParam ?? data?.length ?? 0
    const currentPage: number = limit > 0 ? Math.floor(offset / limit) + 1 : 1
    const lastPage: number = limit > 0 ? Math.ceil(total / limit) : 1
    return {
        meta: {
            perPage: limit,
            currentPage,
            lastPage,
            total,
        },
        items: data,
    }
}