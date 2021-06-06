import Bull from 'bull';

Queue.defaultRedisUrl = undefined as string | undefined;
Queue.events = false as boolean;
Queue.fixTls = false as boolean;

function Queue(
   queueName: string,
   redisUrl?: string | null,
   opts?: Bull.QueueOptions & { fixTls?: boolean; concurrency?: number },
) {
   return function(constructor: new (...args: any) => any): any {
      return class extends constructor {
         constructor() {
            super();

            this.queueName = queueName;
            this.redisUrl = redisUrl || Queue.defaultRedisUrl;

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

            const queue = new Bull(queueName, this.redisUrl, queueOpts);

            this.queue = queue;

            if (Queue.events) {
               const instance = this;

               if (this.onProcess) {
                  queue
                     .process(queueName, opts && opts.concurrency ? opts.concurrency : 1, function(
                        job,
                     ) {
                        return instance.onProcess.bind(instance)(job);
                     })
                     .then()
                     .catch(console.log);
               }
               if (this.onFailure) {
                  queue.on('failed', function(job, err) {
                     return instance.onFailure.bind(instance)(job, err);
                  });
               }
               if (this.onCompleted) {
                  queue.on('completed', function(job, res) {
                     return instance.onCompleted.bind(instance)(job, res);
                  });
               }
            }

            this.add = function(data: any, addOpts: any) {
               return queue.add(queueName, data, addOpts);
            };
         }
      };
   };
}

abstract class QueueInterface<Input = any, Result = any> {
   public readonly queue!: Bull.Queue;
   public readonly queueName!: string;
   protected readonly redisUrl!: string;

   protected abstract onProcess?(this: QueueInterface, job: Bull.Job<Input>): Promise<Result>;
   protected onFailure?(this: QueueInterface, job: Bull.Job<Input>, error: Error): Promise<void>;
   protected onCompleted?(
      this: QueueInterface,
      job: Bull.Job<Input>,
      result: Result,
   ): Promise<void>;
   public add!: (this: QueueInterface, data: Input, opts?: Bull.JobOptions) => Promise<void>;
}

export { Queue, QueueInterface };
