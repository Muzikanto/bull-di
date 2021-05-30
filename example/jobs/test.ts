import Bull from 'bull';
import { Queue, QueueInterface } from '../../src';
import { Inject, Service } from 'typedi';

@Service()
class TestService {
   public getTestValue() {
      return 'testValue';
   }
}

abstract class MyQueueInterface<Input, Result> extends QueueInterface<number, string> {
   public logger = console.log;
}

@Service()
@Queue('test')
class TestQueue extends MyQueueInterface<number, string> {
   @Inject(() => TestService)
   public testService!: TestService;

   async onProcess(job: Bull.Job<number>) {
      this.logger('process', job.data);

      return '1';
   }

   async onFailure(job: Bull.Job<number>, error: Error) {
      this.logger('failure');

      console.error(error);
   }

   public async onCompleted(job: Bull.Job<number>, res: string) {
      this.logger('completed', job.data, res);
   }
}

export default TestQueue;
