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
      this.logger(this.testService.getTestValue());
      return '1';
   }

   onFailure(job: Bull.Job<number>, error: Error) {
      console.error(error);
   }

   public async onCompleted(job: Bull.Job<number>, res: string) {
      console.log(job.data, res);
   }
}

export default TestQueue;
