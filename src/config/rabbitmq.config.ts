import { env } from "@/config/env.config"

export const rabbitmqConfig = {
    url: env.rabbitmq.url,
    user: env.rabbitmq.user,
    password: env.rabbitmq.password,
}