import { env } from "@/config/env.config"

export const redisConfig = {
    url: env.redis.url,
    blacklistPrefix: env.redis.blacklistPrefix,
    onlineUsersKey: env.redis.onlineUsersKey,
}