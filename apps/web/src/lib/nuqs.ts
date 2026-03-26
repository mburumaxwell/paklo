import type { Route } from 'next';
import { type UseQueryStateReturn, parseAsNativeArrayOf as parseAsNativeArrayOfClient, useQueryState } from 'nuqs';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { createLoader, createParser, parseAsNativeArrayOf as parseAsNativeArrayOfServer } from 'nuqs/server';

import { z } from '@/lib/zod';

// oxlint-disable-next-line no-explicit-any -- any is required here
type EnumCodecInput = z.ZodCoercedString<string> | z.ZodPipe<any, any>;
type EnumCodecOutput = z.ZodType;
export function createZodCodecParser<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
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

const BooleanCodec = z.codec(z.string(), z.boolean(), {
  encode: (value) => (value ? 'true' : 'false'),
  decode: (value) => z.stringbool().parse(value),
});
export function booleanFilter() {
  return createZodCodecParser(BooleanCodec);
}
export function useBooleanQueryState(key: string, defaultValue: boolean = false) {
  const options = createZodCodecParser(BooleanCodec).withDefault(defaultValue);
  return useQueryState(key, { ...options, shallow: false });
}

export function enumFilter<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
): ReturnType<typeof createZodCodecParser<Input, Output>>;
export function enumFilter<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue: NonNullable<z.output<Output>>,
): ReturnType<ReturnType<typeof createZodCodecParser<Input, Output>>['withDefault']>;
export function enumFilter<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue?: NonNullable<z.output<Output>>,
) {
  const parser = createZodCodecParser(codec);
  return defaultValue === undefined ? parser : parser.withDefault(defaultValue);
}
export function useEnumQueryFilterState<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  key: string,
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
): UseQueryStateReturn<z.output<Output>, undefined>;
export function useEnumQueryFilterState<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  key: string,
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue: NonNullable<z.output<Output>>,
): UseQueryStateReturn<z.output<Output>, NonNullable<z.output<Output>>>;
export function useEnumQueryFilterState<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  key: string,
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue?: NonNullable<z.output<Output>>,
) {
  const options = defaultValue === undefined ? enumFilter(codec) : enumFilter(codec, defaultValue);
  return useQueryState(key, { ...options, shallow: false });
}

export function enumArrayFilter<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue: z.output<Output>[] = [],
) {
  return parseAsNativeArrayOfServer(createZodCodecParser(codec)).withDefault(defaultValue);
}
export function useEnumArrayQueryFilterState<Input extends EnumCodecInput, Output extends EnumCodecOutput>(
  key: string,
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  defaultValue: z.output<Output>[] = [],
) {
  const options = parseAsNativeArrayOfClient(createZodCodecParser(codec)).withDefault(defaultValue);
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
export function textFilter(defaultValue: string = '') {
  return createZodCodecParser(TextQueryCodec).withDefault(defaultValue);
}
export function useTextQueryState(key: string = 'q', defaultValue: string = '') {
  const options = createZodCodecParser(TextQueryCodec).withDefault(defaultValue);
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
