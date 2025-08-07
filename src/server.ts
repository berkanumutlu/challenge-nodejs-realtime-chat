import http from "http"
import app from "@/app"
import { appConfig } from "@/config/app.config"
import { connectDB } from "@/services/db.service"
import { connectRedis } from "@/services/redis.service"
import { connectRabbitMQ } from "@/services/rabbitmq.service"
import { initSocketIO } from "@/services/socket.service"
import { startCronJobs } from "@/services/cron.service"
import { startMessageQueueConsumer } from "@/services/messageQueue.service"

const port = appConfig.port
const server = http.createServer(app)

// Start the application
const main = async () => {
    try {
        await connectDB()
        await connectRedis()
        await connectRabbitMQ()

        startCronJobs()

        server.listen(port, () => {
            console.log(`env                    : ${appConfig.env}`)
            console.log(`Server running on port : ${port}`)
            initSocketIO(server)
            startMessageQueueConsumer()
        })
    } catch (error) {
        console.error("An error occurred while starting the server:", error)
        process.exit(1)
    }
}
main()