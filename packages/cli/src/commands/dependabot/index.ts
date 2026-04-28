import { Command } from 'commander';

import { command as cleanup } from './cleanup';
import { command as fetchImages } from './fetch-images';
import { command as generate } from './generate';
import { command as run } from './run';
import { command as runCloudJob } from './run-cloud-job';
import { command as validate } from './validate';

export const command = new Command('dependabot')
  .description('Commands for running dependabot updates.')
  .addCommand(fetchImages)
  .addCommand(validate)
  .addCommand(generate)
  .addCommand(run)
  .addCommand(runCloudJob)
  .addCommand(cleanup);
