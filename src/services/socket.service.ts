import { type Server as HttpServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { Types } from "mongoose"
import { appConfig } from "@/config/app.config"
import { messageContentSchema, messageReadSchema } from "@/validations/message.validation"
import { typingStatusSchema } from "@/validations/conversation.validation"
import { isTokenBlacklisted } from "@/services/auth.service"
import { addOnlineUser, findUserById, getOnlineUserIds, removeOnlineUser } from "@/services/user.service"
import { findConversationById, addParticipantToConversation, updateConversationLastMessage } from "@/services/conversation.service"
import { createMessage, markMessageAsRead } from "@/services/message.service"
import { getRedisClient } from "@/services/redis.service"
import { verifyAccessToken } from "@/utils/crypt.util"
import { emitSocketError, getRoomKey } from "@/utils/socket.util"
import { sanitizeAndValidateText } from "@/utils/text.util"

let io: SocketIOServer

export const initSocketIO = (httpServer: HttpServer) => {
    console.time("initSocketIOTime")
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: appConfig.cors.origin,
            methods: ["GET", "POST"],
        },
    })

    // Redis Adapter (multi-instance scaling)
    const pubClient = getRedisClient()
    const subClient = pubClient.duplicate()
    io.adapter(createAdapter(pubClient, subClient))
    // io.adapter(createShardedAdapter(pubClient, subClient))
    console.info("[Socket.IO] - Socket.IO Redis adapter initialized")

    // Socket.IO Auth Middleware
    io.use(async (socket: Socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1]
        if (!token) {
            return next(new Error("Socket.IO Authentication error: Token not provided"))
        }

        try {
            const isBlacklistedToken = await isTokenBlacklisted(token)
            if (isBlacklistedToken) {
                return next(new Error("Socket.IO Authentication error: Invalid or expired token"))
            }

            const decoded = verifyAccessToken(token)
            const user = await findUserById(decoded.userId)
            if (!user) {
                return next(new Error("Socket.IO Authentication error: User not found"))
            }

            socket.data.user = user
            socket.data.token = token

            next()
        } catch (error: any) {
            console.error("Socket.IO Authentication Error:", error.message)
            return next(new Error(`Socket.IO Authentication Error: ${error.message}`))
        }
    })

    io.on("connection", async (socket: Socket) => {
        const user = socket.data.user
        console.log(`[Socket.IO] - A user connected: ${user.username} (${socket.id})`)

        await addOnlineUser(user.id)
        console.log(`[Socket.IO] - User added to online list: ${user.username}`)

        io.emit("user_online", { userId: user.id, username: user.username })

        const onlineUserIds = await getOnlineUserIds()
        socket.emit("online_users_list", onlineUserIds)

        socket.on("join_room", async (roomId: string) => {
            if (!Types.ObjectId.isValid(roomId)) {
                return emitSocketError(socket, "room_error", "Invalid roomId")
            }

            const conversation = await findConversationById(roomId)
            if (!conversation) {
                return emitSocketError(socket, "room_error", "Conversation not found")
            }

            if (!conversation.participants.some((p) => p.equals(user.id))) {
                await addParticipantToConversation(roomId, user.id)
                console.log(`[Socket.IO] - User ${user.username} added to conversation ${roomId}`)
            }

            const roomKey = getRoomKey(roomId)
            socket.join(roomKey)
            console.log(`[Socket.IO] - User ${user.username} joined room: ${roomKey}`)
            io.to(roomKey).emit("user_joined_room", { userId: user.id, username: user.username, roomId })
        })

        socket.on("send_message", async ({ conversationId, content }: { conversationId: string; content: string }) => {
            if (!Types.ObjectId.isValid(conversationId)) {
                return emitSocketError(socket, "message_error", "Invalid conversationId")
            }

            const validationAndSanitizationResult = sanitizeAndValidateText(content, messageContentSchema.shape.content)
            if (!validationAndSanitizationResult.success) {
                return emitSocketError(socket, "message_error", validationAndSanitizationResult.error || "Invalid message content")
            }
            const sanitizedContent = validationAndSanitizationResult.data!

            try {
                const conversation = await findConversationById(conversationId)
                if (!conversation || !conversation.participants.some((p) => p.equals(user.id))) {
                    return emitSocketError(socket, "message_error", "You are not a participant of this conversation")
                }

                const message = await createMessage({
                    conversationId: new Types.ObjectId(conversationId),
                    senderId: user.id,
                    content: sanitizedContent,
                })

                await updateConversationLastMessage(conversationId, message.id)
                console.log(`[Socket.IO] - Conversation ${conversationId} lastMessageId updated to ${message.id}`)

                const roomKey = getRoomKey(conversationId)
                io.to(roomKey).emit("message_received", {
                    _id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    content: message.content,
                    createdAt: message.createdAt,
                    username: user.username,
                })
                console.log(`[Socket.IO] - Message sent to room ${roomKey} by ${user.username}`)
            } catch (error) {
                console.error("Error sending message:", error)
                emitSocketError(socket, "message_error", "Failed to send message")
            }
        })

        socket.on("start_typing", async ({ conversationId }: { conversationId: string }) => {
            try {
                typingStatusSchema.parse({ conversationId })

                const roomKey = getRoomKey(conversationId)
                socket.to(roomKey).emit("user_typing", { userId: user.id, username: user.username, isTyping: true, conversationId })
                console.log(`[Socket.IO] - User ${user.username} started typing in room ${roomKey}`)
            } catch (error: any) {
                emitSocketError(socket, "typing_error", error.issues[0]?.message || "Invalid typing status data")
            }
        })

        socket.on("stop_typing", async ({ conversationId }: { conversationId: string }) => {
            try {
                typingStatusSchema.parse({ conversationId })

                const roomKey = getRoomKey(conversationId)
                socket.to(roomKey).emit("user_typing", { userId: user.id, username: user.username, isTyping: false, conversationId })
                console.log(`[Socket.IO] - User ${user.username} stopped typing in room ${roomKey}`)
            } catch (error: any) {
                emitSocketError(socket, "typing_error", error.issues[0]?.message || "Invalid typing status data")
            }
        })

        socket.on("message_read", async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
            try {
                messageReadSchema.parse({ messageId, conversationId })

                const updatedMessage = await markMessageAsRead(messageId, user.id)
                if (updatedMessage) {
                    const roomKey = getRoomKey(conversationId)
                    io.to(roomKey).emit("message_read_receipt", {
                        messageId: updatedMessage.id,
                        readerId: user.id,
                        readAt: new Date(),
                        conversationId: updatedMessage.conversationId,
                    })
                    console.log(`[Socket.IO] - Message ${messageId} marked as read by ${user.username} in room ${roomKey}`)
                } else {
                    emitSocketError(socket, "message_read_error", "Message not found or already marked as read by this user")
                }
            } catch (error: any) {
                console.error("Error marking message as read:", error)
                emitSocketError(socket, "message_read_error", error.issues[0]?.message || "Failed to mark message as read")
            }
        })

        socket.on("disconnect", async () => {
            console.log(`[Socket.IO] - User disconnected: ${user.username} (${socket.id})`)
            await removeOnlineUser(user.id)
            console.log(`[Socket.IO] - User removed from online list: ${user.username}`)

            io.emit("user_offline", { userId: user.id, username: user.username })
        })
    })

    console.timeEnd("initSocketIOTime")
    return io
}

export const getSocketIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized!")
    }
    return io
}