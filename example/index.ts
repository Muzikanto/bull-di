import 'reflect-metadata';
import { loadQueues, stopQueues, subscribeGracefulShutdown } from '../src';
import { Container } from 'typedi';
import TestQueue from './jobs/test';

loadQueues({
   queues: [TestQueue],
   redisUrl: 'redis://localhost',
   events: true,
   fixTls: false
});
subscribeGracefulShutdown();

Container.get(TestQueue)
   .add(2)
   .then();
Container.get(TestQueue)
   .add(3)
   .then();

setTimeout(() => {
   stopQueues(true).then();
}, 5000);
