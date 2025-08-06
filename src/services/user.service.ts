import { Types } from "mongoose"
import { redisConfig } from "@/config/redis.config"
import { User, type IUser } from "@/models/user.model"
import { getRedisClient } from "@/services/redis.service"

const REDIS_ONLINE_USERS_KEY = redisConfig.onlineUsersKey

export const findAllUsers = async (
    query: Record<string, any> = {},
    limit: number = 0,
    offset: number = 0,
): Promise<{ users: IUser[]; total: number }> => {
    const usersQuery = User.find(query).select("-password -refreshToken")

    if (limit > 0) {
        usersQuery.limit(limit).skip(offset)
    }

    const [users, total] = await Promise.all([
        usersQuery.exec(),
        countUsers(query),
    ])

    return { users, total }
}

export const findUserById = async (id: string) => {
    return await User.findById(id).select("-password -refreshToken")
}

export const findUserByIdWithRefreshToken = async (id: string) => {
    return await User.findById(id).select("+refreshToken")
}

export const findUserByEmail = async (email: string) => {
    return await User.findOne({ email, isActive: true }).select("-refreshToken")
}

export const findUserByUsername = async (username: string) => {
    return await User.findOne({ username, isActive: true }).select("_id")
}

export const checkUsersExistAndActive = async (userIds: string[]): Promise<boolean> => {
    if (userIds.length === 0) {
        return true
    }

    const objectIds = userIds.map(id => new Types.ObjectId(id))

    const foundUsersCount = await countUsers({
        _id: { $in: objectIds },
        isActive: true,
        deletedAt: null,
    })

    return foundUsersCount === userIds.length
}

export const countUsers = async (query: Record<string, any> = {}) => {
    return await User.countDocuments(query)
}

export const createUser = async (data: Partial<IUser>) => {
    const user = new User(data)
    return await user.save()
}

export const updateUserRecord = async (id: string, data: Partial<IUser>) => {
    return await User.findByIdAndUpdate(id, data, { new: true }).select("-password -refreshToken")
}

export const deleteUser = async (id: string, deletedBy?: string) => {
    return await User.softDeleteById(id, deletedBy)
}

export const forceDeleteUser = async (id: string) => {
    return await User.findByIdAndDelete(id)
}

export const addOnlineUser = async (userId: string): Promise<number> => {
    const client = getRedisClient()

    return await client.sAdd(REDIS_ONLINE_USERS_KEY, userId)
}

export const removeOnlineUser = async (userId: string): Promise<number> => {
    const client = getRedisClient()

    return await client.sRem(REDIS_ONLINE_USERS_KEY, userId)
}

export const isUserOnline = async (userId: string): Promise<boolean> => {
    const client = getRedisClient()
    const result = await client.sIsMember(REDIS_ONLINE_USERS_KEY, userId)

    return result === 1
}

export const getOnlineUsersCount = async (): Promise<number> => {
    const client = getRedisClient()

    return await client.sCard(REDIS_ONLINE_USERS_KEY)
}

export const getOnlineUserIds = async (): Promise<string[]> => {
    const client = getRedisClient()

    return await client.sMembers(REDIS_ONLINE_USERS_KEY)
}

export const getPaginatedOnlineUsers = async (
    limit: number = 0,
    offset: number = 0,
    fetchUserDetails: boolean = false,
): Promise<{ users: IUser[] | string[]; total: number }> => {
    const allOnlineUserIds = await getOnlineUserIds()
    const totalOnlineUsers = allOnlineUserIds.length

    let paginatedOnlineUserIds: string[]

    if (limit > 0) {
        paginatedOnlineUserIds = allOnlineUserIds.slice(offset, offset + limit)
    } else {
        paginatedOnlineUserIds = allOnlineUserIds.slice(offset)
    }

    if (fetchUserDetails) {
        const onlineUsers = await Promise.all(
            paginatedOnlineUserIds.map(async (id) => {
                const user = await findUserById(id)
                return user ? user.toObject() : null
            }),
        )
        const filteredOnlineUsers = onlineUsers.filter(Boolean) as IUser[]
        return { users: filteredOnlineUsers, total: totalOnlineUsers }
    } else {
        return { users: paginatedOnlineUserIds, total: totalOnlineUsers }
    }
}