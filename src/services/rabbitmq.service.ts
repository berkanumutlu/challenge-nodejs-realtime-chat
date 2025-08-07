import amqp from "amqplib"
import { rabbitmqConfig } from "@/config/rabbitmq.config"

let channel: amqp.Channel
let connection: amqp.Connection

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(rabbitmqConfig.url)
        channel = await connection.createChannel()
        console.log("RabbitMQ connected")
    } catch (error) {
        console.error("RabbitMQ connection failed:", error)
        process.exit(1)
    }
}

export const getRabbitMQChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized!")
    }
    return channel
}

// Producer
export const publishToQueue = async (queueName: string, message: string) => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized!")
    }

    await channel.assertQueue(queueName, { durable: true })
    channel.sendToQueue(queueName, Buffer.from(message))
    console.log(`Message sent to ${queueName}: ${message}`)
}

// Consumer
export const consumeFromQueue = async (queueName: string, callback: (msg: string) => void) => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized!")
    }
    await channel.assertQueue(queueName, { durable: true })
    channel.consume(
        queueName,
        (msg) => {
            if (msg) {
                callback(msg.content.toString())
                channel.ack(msg)
            }
        },
        { noAck: false },
    )
    console.log(`Consuming from ${queueName}`)
}