import { cleanup } from '@paklo/core/runner';
import { Command } from 'commander';
import { z } from 'zod';

import { type HandlerOptions, handlerOptions } from '../base';

// Docker's 'until' filter accepts Go duration strings: ns, us, ms, s, m, h
const TimeUnitsSchema = z.enum(['ns', 'us', 'ms', 's', 'm', 'h']);
const TimeStringSchema = z.templateLiteral([z.number(), TimeUnitsSchema]);

const schema = z.object({
  cutoff: TimeStringSchema.optional().default('24h'),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error: _error }: HandlerOptions<Options>) {
  const { cutoff } = options;
  cleanup(cutoff);
}

export const command = new Command('cleanup')
  .description('Clean up old docker images, containers and networks.')
  .option(
    '--cutoff <duration>',
    'Cutoff time for cleanup. Accepts Go duration units: ns, us, ms, s, m, h (e.g., 24h, 30m)',
    '24h',
  )
  .action(
    async (...args) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            ...args[0],
          },
          command: args.at(-1),
        }),
      ),
  );
