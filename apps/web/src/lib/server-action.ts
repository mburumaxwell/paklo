import { headers as headersList } from 'next/headers';
import type { ZodType, z } from 'zod';
import { auth, type Session } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { Prisma } from '@/lib/prisma';
import { getRatelimiter, type RateLimiterType } from '@/lib/ratelimit';

/**
 * Custom error for validation failures in server actions.
 * These errors are expected user errors and won't be logged server-side.
 * @example
 * throw new ServerActionValidationError('A secret with this name already exists');
 */
export class ServerActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerActionValidationError';
  }
}

/**
 * A generic type representing the result of an action.
 * It can either contain data of type T or an error message.
 * @remarks
 * The use of optional undefined properties allows for easy deconstruction
 * of the result without TypeScript errors.
 */
export type ActionResult<T> =
  // there is data, no error
  | { data: T; error?: undefined }
  // there is no data, there is an error
  | { data?: undefined; error: { message: string } };

/**
 * Context provided to authorisation policies and handlers, containing request headers,
 * client IP address, and user session information if available.
 */
export type AuthorisationContext = {
  /** Headers from the incoming request, useful for auth, authorisation, and rate limiting */
  headers: Awaited<ReturnType<typeof headersList>>;
  /** Client IP address, useful for auth, authorisation, and rate limiting */
  ip?: string | null;
  /** User session information, if the user is authenticated */
  session?: Session | null;
};

/**
 * Defines the structure of an authorisation policy for a server action.
 * @template I - The type of the input to the server action, used in the custom check function.
 */
export type AuthorisationPolicy<I> =
  | {
      /** An array of user roles that are allowed to execute the server action. */
      roles: string[];
    }
  | {
      /** A custom function to determine if the request is authorised based on the context and input. */
      check: (ctx: AuthorisationContext, input: I) => Promise<boolean> | boolean;
    };

/** Options for rate limiting a server action. */
export type RateLimitOptions = {
  /** The type of rate limiter to apply to the server action */
  type: RateLimiterType;

  /**
   * Optional function to generate a unique key for rate limiting based on the authorisation context.
   * If not provided, the client's IP address will be used as the key by default.
   * @param ctx - The authorisation context containing request information
   * @returns A string key to identify the client for rate limiting purposes
   */
  keyGenerator?: (ctx: AuthorisationContext) => string;
};

/**
 * Options for handling a server action.
 * @template I - The type of the input to the server action, validated by Zod.
 */
export type HandlerOptions<I> = {
  /** The authorisation context for the request. */
  context: AuthorisationContext;
  /** The validated input for the server action. */
  input: I;
};

/** Options for creating a server action. */
export type CreateServerActionOptions<I extends ZodType, O> = {
  /** A Zod schema defining the expected input for the server action. */
  input: I;
  /** Whether authentication is required to execute the server action. */
  auth: boolean;
  /** An optional authorisation policy to determine if the authenticated user has permission to execute the action. */
  authorisation?: AuthorisationPolicy<z.infer<I>>;
  /** Optional rate limiting configuration for the server action. */
  rateLimit?: RateLimitOptions;
  /** The handler function that contains the logic for the server action. */
  handler: (options: HandlerOptions<z.infer<I>>) => Promise<O> | O;
};

/**
 * A utility function to create a server action with built-in input validation, authentication,
 * authorisation, and rate limiting.
 * @template I - The type of the input to the server action, validated by Zod.
 * @template O - The type of the output returned by the server action handler.
 * @param options - The configuration options for the server action.
 * @returns A function that can be called with raw input to execute the server action.
 */
export function createServerAction<I extends ZodType, O>(options: CreateServerActionOptions<I, O>) {
  // having rawInput infer the type even though we validate the input,
  // helps with type inference when calling the action
  return async function action(rawInput: z.infer<I>): Promise<ActionResult<O>> {
    try {
      // validate first (cheap fail)
      const input = options.input.parse(rawInput);

      // get IP and headers for potential use in auth/authorisation and rate limiting
      const headers = await headersList();
      const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim();

      // do auth if required
      const session = await auth.api.getSession({ headers });
      const context: AuthorisationContext = { ip, headers, session };
      if (options.auth) {
        if (!session) {
          return { error: { message: 'Unauthorized' } };
        }

        // do authorisation if required
        if (options.authorisation) {
          let authorised = false;

          if ('roles' in options.authorisation) {
            authorised = !!session.user.role && options.authorisation.roles.includes(session.user.role);
          } else if ('check' in options.authorisation) {
            authorised = await options.authorisation.check(context, input);
          }

          if (!authorised) {
            return { error: { message: 'Forbidden' } };
          }
        }
      }

      // do rate limiting if required
      if (options.rateLimit) {
        const ratelimiter = getRatelimiter(options.rateLimit.type);
        if (ratelimiter) {
          const key = options.rateLimit.keyGenerator?.(context) ?? context.ip;
          if (key) {
            const { success, reset } = await ratelimiter.limit(key);
            if (!success) {
              const retryAfter = Math.ceil((reset - Date.now()) / 1000);
              return { error: { message: `Rate limit exceeded. Try again in ${retryAfter} seconds.` } };
            }
          }
        }
      }

      // execute the handler
      const data = await options.handler({ context, input });
      return { data };
    } catch (error) {
      // log unexpected errors server-side
      if (!(error instanceof ServerActionValidationError)) {
        logger.error(error);
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // return generic message to client
        return { error: { message: 'Database operation failed' } };
      }
      return { error: { message: (error as Error).message } };
    }
  };
}
