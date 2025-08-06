import mongoose from "mongoose"
import { dbConfig } from "@/config/db.config"

export const connectDB = async () => {
    try {
        await mongoose.connect(dbConfig.url)
        console.log("Database connected")
    } catch (err) {
        console.error("Database connection failed:", err)
        process.exit(1)
    }
}