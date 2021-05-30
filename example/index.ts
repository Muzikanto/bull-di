import 'reflect-metadata';
import { loadQueues, Queue, stopQueues, subscribeGracefulShutdown } from '../src';
import { Container } from 'typedi';

Queue.defaultRedisUrl = 'redis://localhost';
// Queue.isWorker = true;

import TestQueue from './jobs/test';

loadQueues({
   queues: [TestQueue],
});
subscribeGracefulShutdown();

Container.get(TestQueue)
   .add(1)
   .then();
Container.get(TestQueue)
   .add(2)
   .then();

setTimeout(() => {
   stopQueues(true).then();
}, 5000);
