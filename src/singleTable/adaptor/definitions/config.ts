import { AnyObject } from 'types';

/**
 * Parameters accepted by the `SingleTable` instance
 */
export interface SingleTableConfig {
  /**
   * The logical separator that joins key paths
   *
   * Defaults to `#`
   *
   * Example: if item key = ['USER', id] => actual dynamodb key = USER#id
   */
  keySeparator?: string;

  /**
   * Your DynamoDB single table
   */
  table: string;

  /**
   * The partition/hash column of your single table
   */
  partitionKey: string;

  /**
   * The range/sort column of your single table
   */
  rangeKey: string;

  /**
   * Type global index that identifies each entity uniquely
   *
   * This is the recommended way of tagging individual entities inside the table
   *
   * You do not actually need to create the GSI on your table.
   *
   * Just know that if you don't, the listType/findType methods won't work
   * Future versions will have a smart type that won't expose those methods if
   * `typeIndex` is not provided
   */
  typeIndex?: {
    /**
     * The partition/hash column of the index.
     *
     * This is what is populated with your entity.type value
     */
    partitionKey: string;

    /**
     * The range/sort column of the index
     *
     * This defaults to the ISO timestamp of creation
     */
    rangeKey: string;

    /**
     * The index name
     */
    name: string;

    /**
     * @param item The item being created
     * @returns The rangeKey value of the type index
     *
     * If you want to opt out of creating this column, return `undefined`
     */
    rangeKeyGenerator?: (item: AnyObject, type: string) => string | undefined;
  };

  /**
   * If your table has TTL configured,
   * provide which is its column name
   */
  expiresAt?: string;

  /**
   * A mapper object to configure your table indexes
   *
   * - `key` - The index name
   * - `value` - The column config of said index
   *
   *
   * @example
   * {
   *  index: {
   *    SomeIndex: { partitionKey: '_indexH1', rangeKey: '_indexR1' },
   *    OtherIndex: { partitionKey: '_indexH2', rangeKey: '_indexR2' }
   *  }
   * }
   * @description
   *
   * Indicates your table has 2 indexes, `SomeIndex` and `OtherIndex`,
   * with _indexH1 + _indexR1 and _indexH2 + _indexR2 as PKs
   */
  indexes?: Record<
    string,
    {
      /**
       * The partition/hash column of the index
       */
      partitionKey: string;

      /**
       * The range/sort column of the index
       */
      rangeKey: string;

      /**
       * Defines if this particular index is of number type:
       *
       * This unlocks you to safely perform atomic update operations (add/subtract)
       * need for leaderboards or the likes without worry for typos or blocked
       * operations. Using the provided helper is safe from any `blockInternalPropUpdate`
       * configuration
       */
      numeric?: boolean;
    }
  >;

  /**
   * If you want to automatically remove all the internal/configuration properties
   * from every item before it is returned by the methods
   *
   * Defaults to `true`
   *
   * If this is turned on, it will remove, if defined in this config:
   *
   * - main table hash/range key columns
   * - type index hash/range key columns
   * - all custom indexes hash/range key columns
   * - TTL attribute
   *
   * This property defaults to `true` to enforce a good practice on single table design:
   *
   * Your item should contain every relevant property independently, and not rely on key conversions/extractions
   *
   * For example, if your item pk/sk is: USER#id + LOG#timestamp
   *
   * you should have an 'id' and 'timestamp' properties defined on it,
   * and not look at the key for that info
   */
  autoRemoveTableProperties?: boolean;

  /**
   * If you want the type index partition key column to be kept from removal
   *
   * This is exposed as its separate config as the entity type may be relevant to identify different query returns
   * or similar use-cases
   *
   * Defaults to `false`
   */
  keepTypeProperty?: boolean;

  /**
   *
   * @param item The general item returned from the table
   * @returns The item that will be exposed by the methods
   *
   * This usually is helpful if you want to customize which properties you'll exclude
   * from your application and should be internal to the table only
   *
   * You don't need to provide this function on most cases, as the `autoRemoveTableProperties` and `keepTypeProperty`
   * handles the removal of all config properties and common scenarios from every item before exposing it to your application
   *
   * If this is provided, neither `autoRemoveTableProperties` and `keepTypeProperty` will have effect
   */
  propertyCleanup?: (item: AnyObject) => AnyObject;

  /**
   * Enables a safety check on every update operation inside your single table to block (with a thrown error) any operation
   * that tries to update an internal property of an item. This includes any key, index key, type key or TTL attribute
   *
   * Useful to prevent indirect code to mess with the internal configuration of your items.
   *
   * Defaults to `true`
   *
   * You can set this to `false` and use the `badUpdateValidation` to further customize which property should be blocked
   */
  blockInternalPropUpdate?: boolean;

  /**
   *
   * @param propertiesInUpdate All the properties referenced in an update action (inside `values`, `remove` and `atomicOperations`)
   * @returns If the proposed update is INVALID
   *
   * This will cause any update action to throw if it fails
   *
   * By default the only validation that is performed is the absence of the table PK inside the references. This will always run,
   * as its a DynamoDB specific rule
   *
   * Possible return values:
   *
   * - `true`: The update is INVALID
   * - `false`: The update is VALID
   * - `string`: The error message to be thrown
   *
   * This could be relevant if you want to guard your application from messing with internal defined properties
   *
   * A common use case is to define each internal property as starting with 1 or 2 underscores (_pk or __pk and so on)
   * so it would be safer to validate if any referenced property on an update has the agreed rule for an internal property
   *
   * It's important to note this happens *before* index/expires properties are added to the update values via their declarative
   * params
   */
  badUpdateValidation?: (propertiesInUpdate: Set<string>) => boolean | string;

  /**
   * Extend/Overwrite schema's `autoGen` capabilities
   * by defining your custom generators. These generation
   * types will be available for reference on each `autoGen`
   * with the same key as they appear here
   *
   * @example
   * ```ts
   * const table = new SingleTable({
   *   ...config,
   *
   *   autoGenerators: {
   *      'my-generator': () => 'CUSTOM!',
   *   }
   * });
   *
   * const entity = table.schema.createEntity({
   *   ...config,
   *
   *    autoGen: {
   *       onCrate: {
   *          createdAt: 'timestamp',
   *          someProp: 'my-generator',
   *       }
   *    }
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoGenerators?: Record<string, () => any>;
}
