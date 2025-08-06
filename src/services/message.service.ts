import { Types } from "mongoose"
import { Message, type IMessage } from "@/models/message.model"
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
