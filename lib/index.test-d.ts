import fastify, { FastifyInstance } from 'fastify'
import type { DistributedScheduleOptions } from './index'
import { fastifyDistributedSchedulePlugin } from './index'

import { expectAssignable,  expectType } from 'tsd'
import Redis from "ioredis";
import Bull from "bull";

const redisOptions = {
  host: 'localhost',
  port: 6379,
  password: 'sOmE_sEcUrE_pAsS',
}

expectAssignable<DistributedScheduleOptions>({
  redisClient: new Redis(),
  tasks: []
})

const app: FastifyInstance = fastify()

const redisClient = new Redis()
app.register(fastifyDistributedSchedulePlugin, {
  redisClient,
  tasks: [{
    jobId: 'jobId',
    queue: Bull('testQueue2', { redis: redisOptions }),
    concurrency: 1,
    payload: {},
    jobOptions: {
      delay: 400,
      repeat: { every: 500 },
    }
  }]
})
