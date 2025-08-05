import type { JwtPayload } from "jsonwebtoken"

export type CryptPayloadType = JwtPayload | string
export type CryptPayloadReturnType = { userId: string }