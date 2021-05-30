// @ts-ignore
import requireAll from 'require-all';
import path from 'path';
import { Container } from 'typedi';
import { Queue } from './queue';

const runnedJobs: { [key: string]: any } = {};

function loadQueues(config: { events?: boolean; queues: any[] | string; redisUrl?: string; fixTls?: boolean }) {
   let rawJobs: any[] = [];

   if (typeof config.events === 'boolean') {
      Queue.events = config.events;
   }
   if (typeof config.fixTls === 'boolean') {
      Queue.fixTls = config.fixTls;
   }
   if (typeof config.events === 'string') {
      Queue.defaultRedisUrl = config.redisUrl;
   }

   if (typeof config.queues === 'string') {
      const modules = requireAll({
         dirname: config.queues || path.resolve('src/jobs'),
         filter: (file: string, path: string) => `${file.split('.')[0]}`,
      });

      rawJobs = Object.values(modules).map((el: any) => el.default);
   } else {
      rawJobs = config.queues;
   }

   for (const rawJob of rawJobs) {
      const job: any = Container.get(rawJob);

      if (!runnedJobs[job.queueName]) {
         runnedJobs[job.queueName] = job;

         Container.set(job, job);
      }
   }

   return runnedJobs;
}

async function stopQueues(doNotWaitJobs?: boolean) {
   for (const jobKey in runnedJobs) {
      const job = runnedJobs[jobKey];

      await job.queue.close(doNotWaitJobs);
   }
}

function subscribeGracefulShutdown(doNotWaitJobs?: boolean) {
   ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
      process.on(signal, () => {
         console.info('Graceful Shutdown. Stop all queues!', signal);

         stopQueues(doNotWaitJobs)
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

export { loadQueues, stopQueues, subscribeGracefulShutdown };
