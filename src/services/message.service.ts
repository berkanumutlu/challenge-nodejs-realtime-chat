import { Types } from "mongoose"
import { Message, type IMessage } from "@/models/message.model"

export const createMessage = async (data: {
    conversationId: Types.ObjectId
    senderId: Types.ObjectId
    content: string
}): Promise<IMessage> => {
    const newMessage = new Message(data)
    return await newMessage.save()
}

export const findMessagesByConversationId = async (conversationId: string, limit: number = 0, offset: number = 0): Promise<{ messages: IMessage[]; total: number }> => {
    const query = { conversationId: new Types.ObjectId(conversationId) }
    const messagesQuery = Message.find(query).populate("senderId", "username email").sort({ createdAt: 1 })

    if (limit > 0) {
        messagesQuery.limit(limit).skip(offset)
    }

    const [messages, total] = await Promise.all([
        messagesQuery.exec(),
        Message.countDocuments(query),
    ])

    return { messages, total }
}


export const markMessageAsRead = async (messageId: string, userId: string): Promise<IMessage | null> => {
    const message = await Message.findById(messageId)
    if (!message) {
        return null
    }

    const userIdObjectId = new Types.ObjectId(userId)

    if (message.senderId.equals(userIdObjectId)) {
        return null
    }

    const isUserAlreadyRead = message.readBy.some((entry) => entry.userId.equals(userIdObjectId))
    if (!isUserAlreadyRead) {
        message.readBy.push({ userId: userIdObjectId, readAt: new Date(), _id: new Types.ObjectId() })
        await message.save()
    }

    return message
}