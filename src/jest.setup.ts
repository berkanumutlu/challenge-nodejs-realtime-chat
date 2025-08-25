import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { type RedisClientType, createClient } from "redis"
import amqp from "amqplib"
import { dbConfig } from "@/config/db.config"
import { redisConfig } from "@/config/redis.config"
import { rabbitmqConfig } from "@/config/rabbitmq.config"
import console from "console"
global.console = console

// Mock Redis service with a more realistic implementation for integration tests
jest.mock("@/services/redis.service", () => {
    // In-memory store to simulate Redis behavior
    const memoryStore = new Map<string, string>()

    const mockRedisClient = {
        connect: jest.fn(() => Promise.resolve()),
        disconnect: jest.fn(() => Promise.resolve()),
        setEx: jest.fn((key: string, ttl: number, value: string) => {
            memoryStore.set(key, value)
            // Simulate TTL by removing after timeout (for testing purposes, we'll keep it simple)
            return Promise.resolve()
        }),
        get: jest.fn((key: string) => {
            const value = memoryStore.get(key)
            return Promise.resolve(value || null)
        }),
        sAdd: jest.fn((key: string, value: string) => {
            const existing = memoryStore.get(key)
            const set = existing ? new Set(JSON.parse(existing)) : new Set()
            const sizeBefore = set.size
            set.add(value)
            memoryStore.set(key, JSON.stringify([...set]))
            return Promise.resolve(set.size - sizeBefore) // Return number of added elements
        }),
        sRem: jest.fn((key: string, value: string) => {
            const existing = memoryStore.get(key)
            if (!existing) return Promise.resolve(0)
            const set = new Set(JSON.parse(existing))
            const removed = set.delete(value)
            memoryStore.set(key, JSON.stringify([...set]))
            return Promise.resolve(removed ? 1 : 0)
        }),
        sIsMember: jest.fn((key: string, value: string) => {
            const existing = memoryStore.get(key)
            if (!existing) return Promise.resolve(0)
            const set = new Set(JSON.parse(existing))
            return Promise.resolve(set.has(value) ? 1 : 0)
        }),
        sCard: jest.fn((key: string) => {
            const existing = memoryStore.get(key)
            if (!existing) return Promise.resolve(0)
            const set = new Set(JSON.parse(existing))
            return Promise.resolve(set.size)
        }),
        sMembers: jest.fn((key: string) => {
            const existing = memoryStore.get(key)
            if (!existing) return Promise.resolve([])
            const set = new Set(JSON.parse(existing))
            return Promise.resolve([...set])
        }),
        flushDb: jest.fn(() => {
            memoryStore.clear()
            return Promise.resolve()
        }),
        isOpen: true,
    }

    return {
        connectRedis: jest.fn(() => Promise.resolve()),
        getRedisClient: jest.fn(() => mockRedisClient),
    }
})
jest.mock("@/services/rabbitmq.service", () => {
    const mockChannel = {
        assertQueue: jest.fn(() => Promise.resolve()),
        sendToQueue: jest.fn(),
        consume: jest.fn(),
        ack: jest.fn(),
        close: jest.fn(),
    }
    return {
        connectRabbitMQ: jest.fn(() => Promise.resolve()),
        getRabbitMQChannel: jest.fn(() => mockChannel),
        publishToQueue: jest.fn((queueName, message) => mockChannel.sendToQueue(queueName, Buffer.from(message))),
        consumeFromQueue: jest.fn((queueName, _callback) => mockChannel.consume(queueName, jest.fn(), { noAck: false })),
    }
})

let mongo: MongoMemoryServer | null = null
let redisClient: RedisClientType
let rabbitmqConnection: amqp.Connection
let rabbitmqChannel: amqp.Channel

// Before all tests, connect to MongoDB (either in-memory or real test instance)
beforeAll(async () => {
    try {
        // Try to use real MongoDB instance first (for Docker environment)
        try {
            await mongoose.connect(dbConfig.url, { serverSelectionTimeoutMS: 5000 })
            console.log("✅ Connected to real MongoDB instance")
        } catch (error) {
            console.log("⚠️ Real MongoDB instance not available, falling back to MongoDB Memory Server")

            // Fallback to MongoDB Memory Server
            mongo = await MongoMemoryServer.create({
                binary: {
                    version: "4.4.18",
                    downloadDir: "/tmp/mongodb-binaries",
                    platform: "linux",
                    arch: "x64",
                    os: {
                        os: "linux",
                        dist: "ubuntu",
                        release: "20.04",
                    },
                },
                instance: {
                    port: 27019, // Different port to avoid conflicts
                    dbName: "test",
                },
            })
            const mongoUri = mongo.getUri()
            dbConfig.url = mongoUri

            await mongoose.connect(mongoUri)
            console.log("✅ MongoDB Memory Server started successfully")
        }
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error)
        throw error
    }

    // Connect Redis (actual connection for integration tests, mocked for unit tests)
    try {
        redisClient = createClient({ url: redisConfig.url })
        redisClient.on("error", (err) => console.error("Redis Test Client Error", err))
        await redisClient.connect()
        console.log("✅ Connected to real Redis client")
    } catch (error) {
        console.log("⚠️ Redis connection skipped (mocked)")
    }

    // Connect RabbitMQ (actual connection for integration tests, mocked for unit tests)
    try {
        rabbitmqConnection = await amqp.connect(rabbitmqConfig.url)
        rabbitmqChannel = await rabbitmqConnection.createChannel()
        console.log("✅ Connected to real RabbitMQ")
    } catch (error) {
        console.log("⚠️ RabbitMQ connection skipped (mocked)")
    }
})

// Before each test, clear the database and Redis
beforeEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        const collection = collections[key]
        if (collection) await collection.deleteMany({})
    }
    await redisClient.flushDb() // Clear Redis data
    // Reset RabbitMQ mocks if needed for specific test scenarios
    jest.clearAllMocks();
})

// After all tests, disconnect from MongoDB and Redis
afterAll(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
    if (redisClient) await redisClient.disconnect()
    if (rabbitmqChannel) await rabbitmqChannel.close()
    if (rabbitmqConnection) await rabbitmqConnection.close()
    console.log("✅ Test cleanup completed")
})