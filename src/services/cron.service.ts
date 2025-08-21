import cron from "node-cron"
import { User } from "@/models/user.model"
import { AutoMessage } from "@/models/autoMessage.model"
import { publishToQueue } from "@/services/rabbitmq.service"

const generateRandomMessageContent = (): string => {
    const messages = [
        "Hello! How are you?",
        "What did you do today?",
        "Hope you had a great day.",
        "Tell me a little about yourself.",
        "What's your favorite hobby?",
        "What kind of music do you like to listen to?",
        "What motivates you most in life?",
        "Did you learn anything interesting today?",
        "What are your plans for the future?",
        "How can I help you?",
    ]
    return messages[Math.floor(Math.random() * messages.length)] ?? ""
}

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j] as T
        shuffled[j] = temp as T
    }
    return shuffled
}

export const startCronJobs = () => {
    // Message Planning Service (Cron Job every night at 02:00) "0 2 * * *"
    cron.schedule("0 2 * * *", async () => {
        console.time("CronJobTime-0 2 * * *")
        console.log("[CronJob] - Running Message Planning Service (Cron Job)")
        try {
            const activeUsers = await User.find({ isActive: true, deletedAt: null })
            if (activeUsers.length < 2) {
                console.warn("[CronJob] - Not enough active users to form pairs for auto messages")
                console.timeEnd("CronJobTime-0 2 * * *")
                return
            }

            const shuffledUsers = shuffleArray(activeUsers)

            for (let i = 0; i < shuffledUsers.length - 1; i += 2) {
                const sender = shuffledUsers[i]
                const receiver = shuffledUsers[i + 1]

                if (!sender || !receiver) {
                    console.warn("[CronJob] - Sender or receiver is undefined, skipping this pair")
                    continue
                }

                const content = generateRandomMessageContent()
                const sendDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

                await AutoMessage.create({
                    trigger: "daily_match",
                    content: content,
                    schedule: "scheduled",
                    options: {
                        senderId: sender.id,
                        receiverId: receiver.id,
                        sendDate: sendDate,
                    },
                    sendDate: sendDate,
                    isQueued: false,
                    isSent: false,
                    createdBy: sender.id,
                })
                console.log(`[CronJob] - Scheduled auto message from ${sender.username} to ${receiver.username}`)
            }
            console.log("[CronJob] - Message Planning Service finished successfully")
        } catch (error) {
            console.error("[CronJob] - Error in Message Planning Service:", error)
        }
        console.timeEnd("CronJobTime-0 2 * * *")
    })

    // Queue Management Service (Worker Cron Job Every Minute) "* * * * *"
    cron.schedule("* * * * *", async () => {
        console.time("CronJobTime-* * * * *")
        console.log("[CronJob] - Running Queue Management Service")
        try {
            const now = new Date()
            const messagesToQueue = await AutoMessage.find({
                sendDate: { $lte: now },
                isQueued: false,
                isSent: false,
                deletedAt: null,
            })

            if (messagesToQueue.length === 0) {
                console.log("[CronJob] - No auto messages to queue at this time")
                console.timeEnd("CronJobTime-* * * * *")
                return
            }

            for (const autoMessage of messagesToQueue) {
                await publishToQueue("message_sending_queue", JSON.stringify(autoMessage.toObject()))
                console.log(`[CronJob] - AutoMessage ${autoMessage.id} sent to RabbitMQ queue`)

                autoMessage.isQueued = true
                await autoMessage.save()
            }
            console.log(`[CronJob] - Queued ${messagesToQueue.length} auto messages`)
        } catch (error) {
            console.error("[CronJob] - Error in Queue Management Service:", error)
        }
        console.timeEnd("CronJobTime-* * * * *")
    })
}