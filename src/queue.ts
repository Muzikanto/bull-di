import Bull, { DoneCallback } from 'bull';
import { runnedJobs } from './loader';

const isWorker = process.env.IS_WORKER === 'true';

function Queue(
   queueName: string,
   redisUrl?: string,
   opts?: Bull.QueueOptions & { fixTls?: boolean },
) {
   return function(constructor: Function) {
      constructor.prototype.queueName = queueName;
      constructor.prototype.redisUrl = redisUrl || Queue.defaultRedisUrl;
      constructor.prototype.opts = opts;

      const queueOpts = opts || {};

      if (opts && opts.fixTls) {
         if (!queueOpts.redis) {
            queueOpts.redis = {};
         }
         // @ts-ignore
         if (!queueOpts.redis.tls) {
            // @ts-ignore
            queueOpts.redis.tls = {};
         }
      }

      const queue = new Bull(
         constructor.prototype.queueName,
         constructor.prototype.redisUrl,
         constructor.prototype.opts,
      );

      constructor.prototype.queue = queue;

      if (Queue.isWorker || isWorker) {
         if (constructor.prototype.onProcess) {
            const onProcess = constructor.prototype.onProcess;

            queue
               .process(constructor.prototype.queueName, 1, function(j) {
                  return onProcess.bind(runnedJobs[constructor.prototype.queueName])(j);
               })
               .then();
         }
         if (constructor.prototype.onFailure) {
            queue.on('failed', constructor.prototype.onFailure);
         }
         if (constructor.prototype.onCompleted) {
            queue.on('completed', constructor.prototype.onCompleted);
         }
      }

      constructor.prototype.add = function(data: any, addOpts: any) {
         return queue.add(constructor.prototype.queueName, data, addOpts);
      };
   };
}

Queue.defaultRedisUrl = undefined as string | undefined;
Queue.isWorker = false as boolean;

abstract class QueueInterface<Input = any, Result = any> {
   public readonly queue!: Bull.Queue;
   protected readonly queueName!: string;
   protected readonly redisUrl!: string;

   public abstract onProcess?(this: {}, job: Bull.Job<Input>, done: DoneCallback): Promise<Result>;
   public onFailure?(this: {}, job: Bull.Job<Input>, error: Error): void;
   public onCompleted?(this: {}, job: Bull.Job<Input>, result: Result): void;
   public add!: (this: {}, data: Input, opts?: Bull.JobOptions) => void;
}

export { Queue, QueueInterface };
