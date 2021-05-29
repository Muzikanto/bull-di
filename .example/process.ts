import Bull, { Job } from 'bull';
import logger from '../../libs/log';
import { onQueueError } from '../../loaders/jobs';
import { REDIS_URL } from '../../libs/external/cache';
import { isDev } from '../../loaders/config';

export const EXAMPLE_QUEUE_NAME = 'example-queue';

export const exampleQueue = new Bull(EXAMPLE_QUEUE_NAME, REDIS_URL, { redis: isDev ? undefined : { tls: {} } });

type JobData = {
  id: string;
};

async function handleProcess(job: Job<JobData>) {
  logger.debug(`${EXAMPLE_QUEUE_NAME} start`);

  // ---
}

async function handleFailed(job: Job<JobData>, error: Error) {
  if (error.toString().includes('remove job')) {
    return job.remove();
  }

  if (job.attemptsMade < 5) {
    return job.retry();
  }

  logger.error(`[${EXAMPLE_QUEUE_NAME}] job failed`);

  await job.remove();

  return Promise.resolve();
}

async function handleCompleted(job: Job<JobData>, result: any = {}) {
  logger.debug(`${EXAMPLE_QUEUE_NAME} completed`);
}

exampleQueue.process(EXAMPLE_QUEUE_NAME, 1, handleProcess);
exampleQueue.on('completed', handleCompleted);
exampleQueue.on('failed', handleFailed);

export const runExampleJob = async (params: JobData) => {
  return new Promise(async () => {
    exampleQueue
      .add(EXAMPLE_QUEUE_NAME, params, {
        delay: 0,
        removeOnComplete: true,
        jobId: EXAMPLE_QUEUE_NAME + '-' + params.id,
      })
      .catch(onQueueError);
  });
};

export function stopExampleJob() {
  exampleQueue.close(false);
}
