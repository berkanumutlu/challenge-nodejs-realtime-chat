import http from "http"
import app from "@/app"
import { appConfig } from "@/config/app.config"

const port = appConfig.port
const server = http.createServer(app)

// Start the application
const main = async () => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}
main()