import http from "http"
import app from "@/app"
import { appConfig } from "@/config/app.config"
import { connectDB } from "@/services/db.service"

const port = appConfig.port
const server = http.createServer(app)

// Start the application
const main = async () => {
    await connectDB()

    server.listen(port, () => {
        console.log(`env                    : ${appConfig.env}`);
        console.log(`Server running on port : ${port}`)
    })
}
main()