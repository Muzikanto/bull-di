import Bull from 'bull';
import { Queue, QueueInterface } from '../../src';
import { Inject, Service } from 'typedi';

@Service()
class TestService {
   public getTestValue() {
      return 'testValue';
   }
}

abstract class MyQueueInterface<Input, Result> extends QueueInterface<number, number> {
   public logger = console.log;
}

@Service()
@Queue('test')
class TestQueue extends MyQueueInterface<number, number> {
   @Inject(() => TestService)
   protected testService!: TestService;

   protected async onProcess(job: Bull.Job<number>) {
      this.logger('process:', job.data);

      return job.data * 2;
   }

   protected async onFailure(job: Bull.Job<number>, error: Error) {
      this.logger('failure', error);
   }

   protected async onCompleted(job: Bull.Job<number>, res: number) {
      this.logger('completed', 'input:', job.data, 'result:', res);
   }
}

export default TestQueue;
