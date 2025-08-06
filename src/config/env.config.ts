import dotenv from "dotenv"

dotenv.config()

export const env = {
    app: {
        env: process.env.NODE_ENV || "development",
        port: Number(process.env.PORT) || 3000,
    },
    db: {
        url: process.env.DB_URL || "",
    },
    redis: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
        blacklistPrefix: process.env.REDIS_BLACKLIST_PREFIX || "blacklist:",
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || "amqp://localhost",
    },
    jwt: {
        access: {
            key: process.env.JWT_ACCESS_SECRET_KEY || "default_access_secret_key",
            expires: process.env.JWT_ACCESS_SECRET_KEY_EXPIRES || "15m",
        },
        refresh: {
            key: process.env.JWT_REFRESH_SECRET_KEY || "default_refresh_secret_key",
            expires: process.env.JWT_REFRESH_SECRET_KEY_EXPIRES || "7d",
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
        methods: process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: process.env.CORS_CREDENTIALS === "true",
    },
}