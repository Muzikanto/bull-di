import Bull from 'bull';
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

      if ((opts && opts.fixTls) || Queue.fixTls) {
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
            queue
               .process(constructor.prototype.queueName, 1, function(job) {
                  return constructor.prototype.onProcess.bind(
                     runnedJobs[constructor.prototype.queueName],
                  )(job);
               })
               .then();
         }
         if (constructor.prototype.onFailure) {
            queue.on('failed', function(job, err) {
               return constructor.prototype.onFailure.bind(
                  runnedJobs[constructor.prototype.queueName],
               )(job, err);
            });
         }
         if (constructor.prototype.onCompleted) {
            queue.on('completed', function(job, res) {
               return constructor.prototype.onCompleted.bind(
                  runnedJobs[constructor.prototype.queueName],
               )(job, res);
            });
         }
      }

      constructor.prototype.add = function(data: any, addOpts: any) {
         return queue.add(constructor.prototype.queueName, data, addOpts);
      };
   };
}

Queue.defaultRedisUrl = undefined as string | undefined;
Queue.isWorker = false as boolean;
Queue.fixTls = false as boolean;

abstract class QueueInterface<Input = any, Result = any> {
   public readonly queue!: Bull.Queue;
   protected readonly queueName!: string;
   protected readonly redisUrl!: string;

   public abstract onProcess?(this: QueueInterface, job: Bull.Job<Input>): Promise<Result>;
   public onFailure?(this: QueueInterface, job: Bull.Job<Input>, error: Error): Promise<void>;
   public onCompleted?(this: QueueInterface, job: Bull.Job<Input>, result: Result): Promise<void>;
   public add!: (this: QueueInterface, data: Input, opts?: Bull.JobOptions) => Promise<void>;
}

export { Queue, QueueInterface };
