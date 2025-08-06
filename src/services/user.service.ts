import { User, type IUser } from "@/models/user.model"

export const findAllUsers = async (
    query: Record<string, any> = {},
    limit: number = 0,
    offset: number = 0,
): Promise<{ users: IUser[], total: number }> => {
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