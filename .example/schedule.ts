import Bull, { Job } from 'bull';
import { isDev } from '../../loaders/config';
import logger from '../../libs/log';
import { onQueueError } from '../../loaders/jobs';
import { REDIS_URL } from '../../libs/external/cache';

export const EXAMPLE_SCHEDULE_QUEUE_NAME = 'example-schedule';

export const exampleQueue = new Bull(EXAMPLE_SCHEDULE_QUEUE_NAME, REDIS_URL, {
  redis: isDev ? undefined : { tls: {} },
});

type JobData = {};

async function handleProcess(job: Job<JobData>) {
  logger.debug(`${EXAMPLE_SCHEDULE_QUEUE_NAME} start`);
}

async function handleFailed(job: Job<JobData>, error: Error) {
  if (error.toString().includes('remove job')) {
    console.log('failed - remove job completely');
    return job.remove();
  }

  if (job.attemptsMade < 2) {
    return job.retry();
  }

  logger.error(`[${EXAMPLE_SCHEDULE_QUEUE_NAME}] job failed`);

  await job.remove();

  return Promise.resolve();
}

async function handleCompleted(job: Job<JobData>) {
  logger.debug(`${EXAMPLE_SCHEDULE_QUEUE_NAME} completed`);
}

exampleQueue.process(EXAMPLE_SCHEDULE_QUEUE_NAME, 1, handleProcess);
exampleQueue.on('failed', handleFailed);
exampleQueue.on('completed', handleCompleted);

export const exampleSchedule = async () => {
  return new Promise(async (resolve: (reason?: any) => void) => {
    await exampleQueue
      .add(
        EXAMPLE_SCHEDULE_QUEUE_NAME,
        {},
        {
          // every 1 hours
          repeat: { cron: '* * * * *' },
          jobId: EXAMPLE_SCHEDULE_QUEUE_NAME,
        }
      )
      .catch(onQueueError);

    resolve();
  });
};

export function stopExampleSchedule() {
  exampleQueue.close(false);
}
