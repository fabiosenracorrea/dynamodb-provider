/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import { SingleTableParams } from 'singleTable/adaptor';

type CreatePartitionIndexParams<TableConfig extends SingleTableParams> =
  undefined extends TableConfig['indexes']
    ? unknown
    : {
        /**
         * Refer to which of your table indexes this partition will exist
         *
         * An Index partition can't create an entity directly, only dump the index
         * into an entity configuration
         */
        index?: keyof TableConfig['indexes'];
      };

export type CreatePartitionParams<TableConfig extends SingleTableParams> =
  CreatePartitionIndexParams<TableConfig> & {
    /**
     * Unique name of the partition
     */
    name: string;

    /**
     * A function that builds the partition key
     *
     * Every single entity of this partition will use this getter to build it's partition value
     *
     * Do not worry about if the param name is not present on some of the entities, you can map the correct key
     * when creating an entity
     *
     * @example
     * ```ts
     * {
     *   getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId]
     * }
     * ```
     */
    getPartitionKey: (p: any) => KeyValue;

    /**
     * Each and every entity inside this partition
     *
     * This definition **does not** define relations, nesting, etc
     *
     * @example say we are creating the USER partition
     * ```ts
     * {
     *   entries: {
     *     permissions: ({ permissionId }: { permissionId }) => ['PERMISSION', permissionId],
     *
     *     loginAttempts: ({ timestamp }: { timestamp }) => ['LOGIN_ATTEMPT', timestamp],
     *   }
     * }
     * ```
     */
    entries: {
      [entryName: string]: (p: any) => KeyValue;
    };
  };

export type PartitionEntry<Params extends CreatePartitionParams<any>> = keyof Params['entries'];

export type PartitionKeyGetters<
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
> = {
  getPartitionKey: Params['getPartitionKey'];
  getRangeKey: Params['entries'][Entry];
};
