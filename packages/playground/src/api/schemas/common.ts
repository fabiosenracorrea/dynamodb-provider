import { z } from 'zod';

/**
 * Mirrors the library's `ExpressionOperation`, minus the ones DynamoDB does not
 * accept on a range key.
 */
export const rangeOperationSchema = z.enum([
  'equal',
  'lower_than',
  'lower_or_equal_than',
  'bigger_than',
  'bigger_or_equal_than',
  'begins_with',
]);

export const conditionOperationSchema = z.enum([
  'equal',
  'not_equal',
  'lower_than',
  'lower_or_equal_than',
  'bigger_than',
  'bigger_or_equal_than',
  'begins_with',
  'contains',
  'not_contains',
]);

export const keyValueSchema = z.union([z.string(), z.number()]);

export const rangeConfigSchema = z.union([
  z.object({
    operation: rangeOperationSchema,
    value: keyValueSchema,
  }),
  z.object({
    operation: z.literal('between'),
    start: keyValueSchema,
    end: keyValueSchema,
  }),
]);

const primitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const conditionSchema = z.union([
  z.object({ operation: conditionOperationSchema, value: primitiveSchema }),
  z.object({
    operation: z.literal('between'),
    start: primitiveSchema,
    end: primitiveSchema,
  }),
  z.object({ operation: z.enum(['in', 'not_in']), values: z.array(primitiveSchema) }),
  z.object({ operation: z.enum(['exists', 'not_exists']) }),
]);

/**
 * A filter is either a bare value (equality), an array (IN), or a full condition.
 */
export const filtersSchema = z.record(
  z.string(),
  z.union([primitiveSchema, z.array(primitiveSchema), conditionSchema]),
);

/** Key getter arguments — names and shapes come from the user's entity, so stay open. */
export const keyParamsSchema = z.record(z.string(), z.unknown());

export const paginationSchema = z.object({
  limit: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
  fullRetrieval: z.boolean().optional(),
});

export const queryOptionsSchema = paginationSchema.extend({
  retrieveOrder: z.enum(['ASC', 'DESC']).optional(),
  filters: filtersSchema.optional(),
  propertiesToRetrieve: z.array(z.string()).optional(),
  range: rangeConfigSchema.optional(),
});

export const itemConditionsSchema = z.array(
  conditionSchema.and(
    z.object({
      property: z.string(),
      joinAs: z.enum(['and', 'or']).optional(),
    }),
  ),
);

export const atomicOperationsSchema = z.array(
  z.union([
    z.object({
      type: z.enum(['add', 'sum', 'subtract']),
      property: z.string(),
      value: z.number(),
    }),
    z.object({
      type: z.enum(['add_to_set', 'remove_from_set']),
      property: z.string(),
      values: z.union([z.array(z.string()), z.array(z.number())]),
    }),
    z.object({
      type: z.literal('set_if_not_exists'),
      property: z.string(),
      value: z.unknown(),
      refProperty: z.string().optional(),
    }),
  ]),
);

export type RangeConfig = z.infer<typeof rangeConfigSchema>;
export type QueryOptions = z.infer<typeof queryOptionsSchema>;
