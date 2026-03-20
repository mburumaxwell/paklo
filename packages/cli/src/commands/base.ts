import { logger } from '@paklo/core/logger';
import type { Command, ErrorOptions } from 'commander';
import type { ZodType } from 'zod';

export type HandlerErrorOptions = ErrorOptions & {
  /** The error message. */
  message: string;
};

export type HandlerOptions<T> = {
  /** The parsed options. */
  options: T;

  /** The command instance. */
  command: Command;

  /**
   * Log an error message and exit the process with the given exit code.
   * @param options - The error message or error options.
   */
  error: (options: string | HandlerErrorOptions) => void;
};

/* oxlint-disable typescript/no-explicit-any */
export type CreateHandlerOptions<T> = {
  schema: ZodType<T>;
  input: Record<string, any>;
  command: any;
};
/* oxlint-enable typescript/no-explicit-any */

export async function handlerOptions<T>({
  schema,
  input,
  command: cmd,
}: CreateHandlerOptions<T>): Promise<HandlerOptions<T>> {
  const options = await schema.parseAsync(input);
  const command = cmd as Command;
  return {
    options,
    command,
    error: (options) => {
      const { message, code, exitCode } = typeof options === 'string' ? { message: options } : options;
      logger.error(message);
      command.error('', { code, exitCode });
    },
  };
}
