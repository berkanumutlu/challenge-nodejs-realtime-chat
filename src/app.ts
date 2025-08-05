import express from "express"
import cors from "cors"
import { responseHandler } from "@/middlewares/response.middleware"

// Start the Express server
const app = express()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(responseHandler)


export default app