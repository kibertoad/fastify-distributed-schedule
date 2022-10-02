const fastify = require('fastify')
const { fastifyDistributedSchedulePlugin } = require('../lib')
const Redis = require('ioredis')
const Bull = require('bull')

const redisOptions = {
  host: 'localhost',
  port: 6379,
  password: 'sOmE_sEcUrE_pAsS',
}

// FixMe https://github.com/OptimalBits/bull/issues/2437
describe('fastifyDistributedSchedule', () => {
  let redis
  let queue
  beforeEach(async () => {
    redis = new Redis(redisOptions)
    queue = Bull('testQueue2', { redis: redisOptions })

    const activeJobsBefore = await queue.getJobs(['active', 'completed'])

    await queue.clean(0)

    const activeJobsAfter = await queue.getJobs(['active', 'completed'])
    //expect(activeJobsAfter.length).toBe(0)
  })
  afterEach(async () => {
    await redis.disconnect()
    await queue.close(true)
  })

  it('creates tasks app startup', async () => {
    let counter = 0
    let completedCounter = 0
    const app = fastify()

    void queue.process(() => counter++)

    app.register(fastifyDistributedSchedulePlugin, {
      redisClient: redis,
      tasks: [
        {
          queue,
          concurrency: 2,
          jobId: 'increaseCounter',
          jobOptions: {
            delay: 400,
            repeat: { every: 500 },
          },
        },
      ],
    })

    const activeJobsBefore = await queue.getJobs(['active', 'completed'])
    //expect(activeJobsBefore.length).toBe(0)

    await app.ready()

    const activeJobsAfter = await queue.getJobs(['active', 'completed'])
    expect(activeJobsAfter.length).toBe(2)

    await new Promise((resolve) =>
      queue.on('completed', (value) => {
        completedCounter++
        if (completedCounter >= 3) {
          resolve()
        }
      })
    )
  }, 5000)
})
