import { createClient, type RedisClientType } from "redis"
import { env } from "@/config/env.config"

let redisClient: RedisClientType

export const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: env.redis.url,
        })
        redisClient.on("error", (err) => console.error("Redis Client Error", err))
        await redisClient.connect()
        console.log("Redis connected")
    } catch (error) {
        console.error("Redis connection failed:", error)
        process.exit(1)
    }
}

export const getRedisClient = (): RedisClientType => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client is not connected.")
    }
    return redisClient
}