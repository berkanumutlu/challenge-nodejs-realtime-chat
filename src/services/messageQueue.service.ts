import { Types } from "mongoose"
import { AutoMessage, type IAutoMessage } from "@/models/autoMessage.model"
import { consumeFromQueue } from "@/services/rabbitmq.service"
import { createMessage } from "@/services/message.service"
import { updateConversationLastMessage, findExistingConversationByParticipants, createConversation } from "@/services/conversation.service"
import { getSocketIO } from "@/services/socket.service"
import { findUserById } from "@/services/user.service"
import { getRoomKey } from "@/utils/socket.util"

export const startMessageQueueConsumer = () => {
    consumeFromQueue("message_sending_queue", async (messageContent) => {
        console.log("Received message from queue:", messageContent)
        try {
            const autoMessageData: IAutoMessage = JSON.parse(messageContent)

            // Check if the message has already been sent to prevent duplicates if consumer restarts
            const existingAutoMessage = await AutoMessage.findById(autoMessageData.id)
            if (existingAutoMessage && existingAutoMessage.isSent) {
                return console.log(`AutoMessage ${autoMessageData.id} already sent. Skipping`)
            }

            const senderId = autoMessageData.options?.senderId
            const receiverId = autoMessageData.options?.receiverId
            let conversationId = autoMessageData.options?.conversationId

            if (!senderId || !receiverId || !autoMessageData.content) {
                return console.error("Invalid auto message data received: Missing senderId, receiverId, or content", autoMessageData)
            }

            let targetConversationId: Types.ObjectId

            if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
                const participantIds = [senderId.toString(), receiverId.toString()]
                let conversation = await findExistingConversationByParticipants(participantIds)

                if (!conversation) {
                    conversation = await createConversation(participantIds, senderId.toString())
                    console.log(`New conversation created for auto message: ${conversation.id}`)
                }
                targetConversationId = conversation.id
            } else {
                targetConversationId = new Types.ObjectId(conversationId)
            }

            const newMessage = await createMessage({
                conversationId: targetConversationId,
                senderId: new Types.ObjectId(senderId),
                content: autoMessageData.content,
            })

            await updateConversationLastMessage(targetConversationId.toString(), newMessage.id)

            const senderUser = await findUserById(senderId)
            const senderUsername = senderUser ? senderUser.username : "System"

            // Emit message via Socket.IO
            const io = getSocketIO()
            const roomKey = getRoomKey(targetConversationId.toString())
            io.to(roomKey).emit("message_received", {
                _id: newMessage.id,
                conversationId: newMessage.conversationId,
                senderId: newMessage.senderId,
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                username: senderUsername,
            })
            console.log(`Auto message ${newMessage.id} sent to conversation ${targetConversationId} via Socket.IO`)

            // Mark AutoMessage as sent
            await AutoMessage.findByIdAndUpdate(autoMessageData.id, { isSent: true })
            console.log(`AutoMessage ${autoMessageData._id} marked as sent`)

        } catch (error) {
            console.error("Error processing message from queue:", error)
        }
    })
    console.log("RabbitMQ Message Distribution Service started (Consumer)")
}