import http from "http"
import app from "@/app"

const port = 3000
const server = http.createServer(app)

// Start the application
const main = async () => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}
main()