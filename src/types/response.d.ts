type ResponseMetaDataType = {
    currentPage: number
    perPage: number
    lastPage: number
    total: number
}

export type PaginatedResponseType = {
    meta: ResponseMetaDataType
    items: any
}