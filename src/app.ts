import express from "express"
import cors from "cors"
import { appConfig } from "@/config/app.config"
import routes from "@/routes"
import { responseHandler } from "@/middlewares/response.middleware"
import { errorHandler } from "@/middlewares/error.middleware"

// Start the Express server
const app = express()

// Middlewares
app.use(cors(appConfig.cors))
app.use(express.json())
app.use(responseHandler)

// Route definitions
app.use("/api", routes)

// Error handling middleware
app.use(errorHandler)

export default app