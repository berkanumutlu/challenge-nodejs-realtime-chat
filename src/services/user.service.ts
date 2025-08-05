import { User, type IUser } from "@/models/user.model"

export const listUsers = async (query: Record<string, any> = {}) => {
    return User.find(query).select("-password -refreshToken")
}

export const findUserById = async (id: string) => {
    return User.findById(id).select("-password -refreshToken")
}

export const findUserByIdWithRefreshToken = async (id: string) => {
    return User.findById(id).select("+refreshToken")
}

export const findUserByEmail = async (email: string) => {
    return User.findOne({ email })
}

export const findUserByUsername = async (username: string) => {
    return User.findOne({ username })
}

export const countUsers = async (query: Record<string, any> = {}) => {
    return User.countDocuments(query)
}

export const createUser = async (data: Partial<IUser>) => {
    const user = new User(data)
    return user.save()
}

export const updateUser = async (id: string, data: Partial<IUser>) => {
    return User.findByIdAndUpdate(id, data, { new: true }).select("-password -refreshToken")
}

export const deleteUser = async (id: string, deletedBy?: string) => {
    await User.softDeleteById(id, deletedBy)
}

export const forceDeleteUser = async (id: string) => {
    return User.findByIdAndDelete(id)
}