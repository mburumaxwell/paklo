import { type core, z as zod } from 'zod';

// we are doing this to allow use modify zod to our taste
export const z = {
  ...zod,

  /** Creates a codec for an enum schema. */
  enumCodec: <V extends string, T extends zod.ZodEnum<{ [U in V]: U }>>(enumSchema: T) =>
    zod.codec(zod.string(), enumSchema, {
      encode: (value) => value,
      decode: (value) => enumSchema.parse(value) as unknown as zod.input<T>,
    }),

  /** Schema for date periods with start and end dates. */
  period: () =>
    zod.object(
      {
        /** Start date of the period. */
        start: zod.coerce.date(),

        /** End date of the period. */
        end: zod.coerce.date(),
      },
      'Invalid period',
    ),

  /** Transforms a value that can be either a single item or an array of items into an array. */
  singleOrArray: <T extends zod.ZodTypeAny>(schema: T) =>
    zod.union([schema, zod.array(schema)]).transform((value) => {
      if (value === undefined) return undefined;
      return Array.isArray(value) ? value : [value];
    }),

  /** Schema for search query parameters. */
  searchQuery: () =>
    zod.object({
      q: zod.string().trim().max(100).default(''),
      limit: zod.coerce.number().int().min(1).max(50).default(20),
      selectedId: z.singleOrArray(zod.string().trim()).optional(),
    }),
};

// oxlint-disable no-explicit-any -- any is required here
export namespace z {
  export type infer<T extends zod.ZodType<any, any, any>> = zod.infer<T>;
  export type input<T extends zod.ZodType<any, any, any>> = zod.input<T>;
  export type output<T extends zod.ZodType<any, any, any>> = zod.output<T>;

  // re-export types we use types
  export interface ZodType<
    Output = unknown,
    Input = unknown,
    Internals extends core.$ZodTypeInternals<Output, Input> = core.$ZodTypeInternals<Output, Input>,
  > extends zod.ZodType<Output, Input, Internals> {}
  export interface ZodCoercedString<T = unknown> extends zod.ZodCoercedString<T> {}
  export interface ZodPipe<A extends core.$ZodType, B extends core.$ZodType> extends zod.ZodPipe<A, B> {}
  export interface ZodCodec<Input extends core.$ZodType, Output extends core.$ZodType> extends zod.ZodCodec<
    Input,
    Output
  > {}
}
// oxlint-enable no-explicit-any -- any is required here

export type * from 'zod';
