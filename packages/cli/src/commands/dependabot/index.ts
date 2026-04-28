import { Command } from 'commander';

import { command as run } from './run-cloud-job';

export const command = new Command('dependabot').description('Dependabot commands.').addCommand(run);
