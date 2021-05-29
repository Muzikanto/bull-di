<h1 align="center">Bull DI</h1>

<div align="center">

[![npm version](https://badge.fury.io/js/bull-di.svg)](https://badge.fury.io/js/bull-di)
[![downloads](https://img.shields.io/npm/dm/bull-di.svg)](https://www.npmjs.com/package/bull-di)
[![size](https://img.shields.io/bundlephobia/minzip/bull-di)](https://bundlephobia.com/result?p=bull-di)
[![Coverage Status](https://img.shields.io/codecov/c/github/muzikanto/bull-di/master.svg)](https://codecov.io/gh/muzikanto/bull-di/branch/master)
[![dependencies Status](https://david-dm.org/bull-di/status.svg)](https://david-dm.org/bull-di)
[![type](https://badgen.net/npm/types/bull-di)](https://badgen.net/npm/types/bull-di)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/muzikanto/bull-di/blob/master/LICENSE)
![Code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)

</div>

<!-- TOC -->

-  [Installation](#installation)
-  [Example](#example)
-  [License](#license)

<!-- /TOC -->

## Installation

```sh
npm i bull-di
# or
yarn add bull-di
```

## Example

### Root File

```typescript jsx
import { startJobs, subscribeGracefulShutdown } from 'bull-dii';

startJobs({ redisUrl: 'redis://localhost', pathToJobs: __dirname + '/src/jobs' });
subscribeGracefulShutdown();
```

### Job File

```typescript jsx
import Bull from 'bull';
import { Queue, QueueInterface } from 'bull-di';

@Queue('subscription-expire', 'redis://localhost')
class SubscriptionExpireQueue extends QueueInterface<{ userId: string }, { completedAt: Date }> {
   async onProcess(job: Bull.Job<{ userId: string }>) {
      await doSomething();

      return {
         completedAt: new Date(),
      };
   }

   public async onCompleted(job: Bull.Job<{ userId: string }>, res: { completedAt: Date }) {
      console.log(`Subscription-expire userId:${job.data.userId} at:${res.completedAt}`);
   }
}

export default Test;
```

## License

[MIT](LICENSE)