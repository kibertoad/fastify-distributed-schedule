import { FastifyPluginCallback } from 'fastify'
import { JobOptions, Queue } from 'bull'
import { Redis } from 'ioredis'

export type TaskConfiguration = {
  queue: Queue
  payload?: Record<string, any>
  concurrency: number
  jobId: string
  jobOptions: JobOptions
}

export interface DistributedScheduleOptions {
  redisClient: Redis
  tasks: readonly TaskConfiguration[]
}

export const fastifyDistributedSchedulePlugin: FastifyPluginCallback<
  NonNullable<DistributedScheduleOptions>
>
