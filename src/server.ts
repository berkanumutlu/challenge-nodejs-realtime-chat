import http from "http"
import app from "@/app"
import { appConfig } from "@/config/app.config"
import { connectDB } from "@/services/db.service"
import { connectRedis } from "@/services/redis.service"
import { initSocketIO } from "@/services/socket.service"

const port = appConfig.port
const server = http.createServer(app)

// Start the application
const main = async () => {
    try {
        await connectDB()
        await connectRedis()

        server.listen(port, () => {
            console.log(`env                    : ${appConfig.env}`)
            console.log(`Server running on port : ${port}`)
            initSocketIO(server)
        })
    } catch (error) {
        console.error("An error occurred while starting the server:", error)
        process.exit(1)
    }
}
main()