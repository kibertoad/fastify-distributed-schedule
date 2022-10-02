const fp = require('fastify-plugin')
const { Mutex } = require('redis-semaphore')

const DEFAULT_LOCK_TIMEOUT = 1000 * 60

function plugin(fastify, opts, next) {
  const { tasks, redisClient, lockTimeout } = opts
  const mutex = new Mutex(redisClient, 'locks:fastify-distributed-schedule', {
    lockTimeout: lockTimeout || DEFAULT_LOCK_TIMEOUT,
  })

  fastify.addHook('onReady', async () => {
    await mutex.acquire()
    try {
      for (let task of tasks) {
        const { queue, payload, jobOptions } = task
        for (let step = 0; step < task.concurrency; step++) {
          const jobId = `${task.jobId}-${step}`

          const existingJob = await queue.getJob(jobId)
          if (existingJob) {
            continue
          }

          // await would hang here
          queue.add(jobId, payload, {
            ...jobOptions,
            jobId,
          })
        }
      }
    } finally {
      await mutex.release()
    }
  })

  next()
}

const fastifyDistributedSchedulePlugin = fp(plugin, {
  fastify: '4.x',
  name: 'fastify-distributed-schedule',
})

module.exports = {
  fastifyDistributedSchedulePlugin,
}
