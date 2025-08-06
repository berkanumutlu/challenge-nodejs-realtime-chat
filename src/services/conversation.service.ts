import { Types } from "mongoose"
import { Conversation, type IConversation } from "@/models/conversation.model"

export const findUserConversations = async (userId: string, limit: number = 0, offset: number = 0): Promise<{ conversations: IConversation[]; total: number }> => {
    const query = { participants: new Types.ObjectId(userId) }
    const conversationsQuery = Conversation.find(query).populate("participants", "username email")

    if (limit > 0) {
        conversationsQuery.limit(limit).skip(offset)
    }

    const [conversations, total] = await Promise.all([
        conversationsQuery.exec(),
        Conversation.countDocuments(query),
    ])

    return { conversations, total }
}

export const findConversationById = async (id: string): Promise<IConversation | null> => {
    return await Conversation.findById(id).populate("participants", "username email")
}

export const findExistingConversationByParticipants = async (
    participantIds: string[],
): Promise<IConversation | null> => {
    const sortedParticipantIds = [...new Set(participantIds)].sort()
    const objectIds = sortedParticipantIds.map((id) => new Types.ObjectId(id))

    return await Conversation.findOne({
        participants: {
            $size: objectIds.length,
            $all: objectIds,
        },
        deletedAt: null,
    }).populate("participants", "username email")
}


export const createConversation = async (participantIds: string[], createdBy: string): Promise<IConversation> => {
    const sortedParticipantIds = [...new Set(participantIds)].sort()
    const participants = sortedParticipantIds.map((id) => new Types.ObjectId(id))

    const newConversation = new Conversation({
        participants,
        createdBy: new Types.ObjectId(createdBy),
    })

    return await newConversation.save()
}

export const addParticipantToConversation = async (conversationId: string, userId: string): Promise<IConversation | null> => {
    return await Conversation.findByIdAndUpdate(
        conversationId,
        { $addToSet: { participants: new Types.ObjectId(userId) } },
        { new: true },
    )
}

export const updateConversationLastMessage = async (conversationId: string, messageId: string): Promise<IConversation | null> => {
    return await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageId: new Types.ObjectId(messageId) },
        { new: true },
    )
}

export const removeParticipantFromConversation = async (conversationId: string, userId: string): Promise<IConversation | null> => {
    return await Conversation.findByIdAndUpdate(
        conversationId,
        { $pull: { participants: new Types.ObjectId(userId) } },
        { new: true },
    )
}