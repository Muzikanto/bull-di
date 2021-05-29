import 'reflect-metadata';
import { startJobs, stopJobs, subscribeGracefulShutdown } from '../src';
import TestQueue from './jobs/test';
import path from 'path';
import { Container } from 'typedi';

startJobs({ redisUrl: 'redis://localhost', pathToJobs: path.resolve('example/jobs') });
subscribeGracefulShutdown();

Container.get(TestQueue).add(1);
Container.get(TestQueue).add(1);

setTimeout(() => {
   stopJobs(true).then();
}, 5000);
