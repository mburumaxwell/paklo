import type { Route } from 'next';
import { parseAsNativeArrayOf as parseAsNativeArrayOfClient, useQueryState } from 'nuqs';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { createLoader, createParser, parseAsNativeArrayOf as parseAsNativeArrayOfServer } from 'nuqs/server';

import { z } from '@/lib/zod';

export function createZodCodecParser<
  // oxlint-disable-next-line no-explicit-any -- any is required here
  Input extends z.ZodCoercedString<string> | z.ZodPipe<any, any>,
  Output extends z.ZodType,
>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  eq: (a: z.output<Output>, b: z.output<Output>) => boolean = (a, b) => a === b,
) {
  return createParser<z.output<Output>>({
    parse: (value) => codec.parse(value),
    serialize: (value) => codec.encode(value),
    eq,
  });
}

export {
  // server side
  NuqsAdapter,
  createLoader,
  parseAsNativeArrayOfServer,
  // client side
  useQueryState,
  parseAsNativeArrayOfClient,
};

export function enumFilter<
  // oxlint-disable-next-line no-explicit-any -- any is required here
  Input extends z.ZodCoercedString<string> | z.ZodPipe<any, any>,
  Output extends z.ZodType,
>(codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>) {
  return parseAsNativeArrayOfServer(createZodCodecParser(codec)).withDefault([]);
}

export function useEnumQueryFilterState<
  // oxlint-disable-next-line no-explicit-any -- any is required here
  Input extends z.ZodCoercedString<string> | z.ZodPipe<any, any>,
  Output extends z.ZodType,
>(key: string, codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>) {
  const options = parseAsNativeArrayOfClient(createZodCodecParser(codec)).withDefault([]);
  return useQueryState(key, { ...options, shallow: false });
}

const BigIntCodec = z.codec(z.string(), z.bigint(), {
  encode: (value) => value.toString(),
  decode: (value) => BigInt(value),
});

export function offsetFilter() {
  return createZodCodecParser(BigIntCodec);
}

export function useOffsetQueryState(key: string = 'offset') {
  const options = createZodCodecParser(BigIntCodec);
  return useQueryState(key, { ...options, shallow: false });
}

const TextQueryCodec = z.codec(z.string(), z.string(), {
  encode: (value) => value.trim(),
  decode: (value) => value.trim(),
});

export function textFilter() {
  return createZodCodecParser(TextQueryCodec).withDefault('');
}

export function useTextQueryState(key: string = 'q') {
  const options = createZodCodecParser(TextQueryCodec).withDefault('');
  return useQueryState(key, { ...options, shallow: false });
}

export function redirectToParam(defaultValue: Route = '/dashboard') {
  return createParser<Route>({
    parse: (value) =>
      z
        .string()
        .refine((path) => path.startsWith('/'), 'Redirect path must be an in-app route')
        .refine((path) => !path.startsWith('//'), 'Redirect path must not be protocol-relative')
        .refine((path) => !path.includes('://'), 'Redirect path must not be absolute')
        .parse(value) as Route,
    serialize: (value) => value,
    eq: (a, b) => a === b,
  }).withDefault(defaultValue);
}
