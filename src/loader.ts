// @ts-ignore
import requireAll from 'require-all';
import path from 'path';
import { QueueInterface, Queue } from './queue';
import { Container } from 'typedi';

export const runnedJobs: { [key: string]: InstanceType<typeof QueueInterface> } = {};

function startJobs(config: { pathToJobs?: string; redisUrl?: string }) {
   const modules = requireAll({
      dirname: config.pathToJobs || path.resolve('src/jobs'),
      filter: (file: string, path: string) => `${file.split('.')[0]}`,
   });

   Queue.defaultRedisUrl = config.redisUrl;

   const rawJobs: any[] = Object.values(modules).map((el: any) => el.default);

   for (const rawJob of rawJobs) {
      const job: any = Container.get(rawJob);

      if (!runnedJobs[job.queueName]) {
         runnedJobs[job.queueName] = job;

         Container.set(job, job);
      }
   }

   return runnedJobs;
}

async function stopJobs(doNotWaitJobs?: boolean) {
   for (const jobKey in runnedJobs) {
      const job = runnedJobs[jobKey];

      await job.queue.close(doNotWaitJobs);
   }
}

function subscribeGracefulShutdown(doNotWaitJobs?: boolean) {
   ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
      process.on(signal, () => {
         console.info('Graceful Shutdown. Stop all queues!', signal);

         stopJobs(doNotWaitJobs)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
      });
   });
}

// function getJob<T extends new (...args: any) => any>(queueInterface: T): InstanceType<T> {
//    const job = runnedJobs[queueInterface.prototype.queueName];
//
//    return job as InstanceType<T>;
// }

export { startJobs, stopJobs, subscribeGracefulShutdown };
