import mongoose from "mongoose"
import { dbConfig } from "@/config/db.config"

export const connectDB = async () => {
    console.time("dbConnectionTime")
    try {
        await mongoose.connect(dbConfig.url)
        console.log("[DB] - connected")
    } catch (err) {
        console.error("[DB] - connection failed:", err)
        process.exit(1)
    }
    console.timeEnd("dbConnectionTime")
}