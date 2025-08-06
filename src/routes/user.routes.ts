import { Router } from "express"
import { updateUserSchema } from "@/validations/user.validation"
import { authenticatedMiddleware } from "@/middlewares/auth.middleware"
import { validateRequestBody } from "@/middlewares/validation.middleware"
import { getUserList, updateUser } from "@/controllers/user.controller"

const userRouter = Router()

userRouter.get("/list", authenticatedMiddleware, getUserList)
userRouter.put("/update", authenticatedMiddleware, validateRequestBody(updateUserSchema), updateUser)

export default userRouter