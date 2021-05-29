import 'reflect-metadata';
import { loadQueues, Queue, stopQueues, subscribeGracefulShutdown } from '../src';
import path from 'path';
import { Container } from 'typedi';

Queue.defaultRedisUrl = 'redis://localhost';
// Queue.isWorker = true;

import TestQueue from './jobs/test';

loadQueues({
   pathToJobs: path.resolve('example/jobs'),
});
subscribeGracefulShutdown();

Container.get(TestQueue).add(1);
Container.get(TestQueue).add(1);

setTimeout(() => {
   stopQueues(true).then();
}, 5000);
