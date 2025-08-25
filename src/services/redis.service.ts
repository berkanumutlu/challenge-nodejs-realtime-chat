import { createClient, type RedisClientType } from "redis"
import { redisConfig } from "@/config/redis.config"

let redisClient: RedisClientType

export const connectRedis = async () => {
    console.time("redisConnectionTime")
    try {
        redisClient = createClient({
            url: redisConfig.url,
        })
        redisClient.on("error", (err) => console.error("Redis Client Error", err))
        await redisClient.connect()
        console.log("[Redis] - connected")
    } catch (error) {
        console.error("[Redis] - connection failed:", error)
        process.exit(1)
    }
    console.timeEnd("redisConnectionTime")
}

export const getRedisClient = (): RedisClientType => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client is not connected")
    }
    return redisClient
}