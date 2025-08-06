import { env } from "@/config/env.config"

export const cryptConfig = {
    keys: {
        access: {
            secret: {
                key: env.jwt.access.key,
                expire: env.jwt.access.expires,
            },
        },
        refresh: {
            secret: {
                key: env.jwt.refresh.key,
                expire: env.jwt.refresh.expires,
            },
        },
    },
    bcrypt: {
        saltRounds: 10,
    },
}