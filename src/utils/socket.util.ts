import { Socket } from "socket.io"

export const emitSocketError = (socket: Socket, event: string, message: string) => {
    socket.emit(event, { success: false, message })
    console.warn(`Socket Error on ${event}: ${message} for user ${socket.data.user?.username}`)
}

export const getRoomKey = (roomId: string): string => {
    return `conversation:${roomId}`
}