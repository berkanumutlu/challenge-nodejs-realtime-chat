import dotenv from "dotenv"

dotenv.config()

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 3000,
    DB_URL: process.env.DB_URL || "",
    REDIS_URL: process.env.REDIS_URL || "",
    RABBITMQ_URL: process.env.RABBITMQ_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "default_secret_key",
}