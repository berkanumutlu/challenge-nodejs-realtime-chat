import { Router } from "express"
import { updateUserSchema } from "@/validations/user.validation"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { validateRequestBody } from "@/middlewares/validation.middleware"
import { getIsUserOnline, getOnlineUserCount, getOnlineUserList, getUserList, updateUser } from "@/controllers/user.controller"

const userRouter = Router()

userRouter.get("/list", authenticatedMiddleware, getUserList)
userRouter.put("/update", authenticatedMiddleware, validateRequestBody(updateUserSchema), updateUser)

userRouter.get("/online/list", authenticatedMiddleware, getOnlineUserList)
userRouter.get("/online/count", authenticatedMiddleware, getOnlineUserCount)
userRouter.get("/online/is-online/:userId", authenticatedMiddleware, getIsUserOnline)

export default userRouter