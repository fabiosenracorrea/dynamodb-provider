/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, PrettifyObject } from 'types';

import {
  DefinedNameRangeKeyConfig,
  KeyValue,
  SingleTableConfig,
} from 'singleTable/adaptor/definitions';

import { pick } from 'utils/object';
import { ExtendableSingleTableEntity } from '../entity';

type RefEntity = ExtendableSingleTableEntity;

export type Sorter = (a: any, b: any) => number;
export type Extractor<E = any> = (a: E) => any;

type KeyGetter = (...p: any[]) => KeyValue;

type CollectionIndexParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['indexes']
    ? unknown
    : {
        /**
         * Refer to which of your table indexes this collection exists
         */
        index?: keyof TableConfig['indexes'];
      };

type HasPartitionKey = {
  getPartitionKey: KeyGetter;
};

type PartitionRefParams<TableConfig extends SingleTableConfig> =
  | ({
      /**
       * Partition Key getter
       */
      getPartitionKey: KeyGetter;

      partition?: never;
    } & CollectionIndexParams<TableConfig>)
  | {
      /**
       * Partition Key getter
       */
      getPartitionKey?: never;

      /**
       * An existing partition
       *
       * If you pass in an index partition, it will be inferred automatically
       */
      partition: HasPartitionKey;
    };

type SorterProps<Params> = Params extends { sorter: Sorter }
  ? { sorter: Params['sorter'] }
  : object;

type ExtractorProps<Params extends { extractor?: Extractor }> =
  Params['extractor'] extends Extractor ? { extractor: Params['extractor'] } : object;

// resolver = needs a function to receive a item => true if its part of the join
// position = we get every TYPE of the item to join the parent until a new parent-type is found

type EntityJoinMethod = 'RESOLVER' | 'POSITION' | 'BY_TYPE'; // DEFAULT IS BY_TYPE

type JoinResolver<Parent = AnyObject, Child = AnyObject> = (
  parent: Parent,
  possibleChild: Child,
) => boolean;

export type JoinResolutionParams = {
  /**
   * Join method that should be applied to the entity
   *
   * You have 3 options:
   *
   * - `POSITION` - this method joins every entity type that is sequentially extracted on the query. Requires `typeIndex` to be configured
   * - `BY_TYPE` - gathers all items from the type. Requires `typeIndex` to be configured
   * - `RESOLVER` - use a custom resolver, in the `(parent, child) => boolean` format to determine relation
   *
   * Default is `POSITION`
   */
  method?: EntityJoinMethod;

  /**
   * A helper function used if the join method is `RESOLVER`
   *
   * Format: `(parent, child) => boolean`
   *
   * @param parent entity to receive the join
   * @param child entity to verify if should be joined
   * @returns true/false if the join should occur
   */
  resolver?: JoinResolver;
};

type EntityDepthParams =
  | {
      /**
       * Your Join type
       *
       * - `SINGLE` - will result into a single ref entity object
       * - `MULTIPLE` - will result in a list of ref entities
       */
      type: 'SINGLE';
    }
  | {
      /**
       * Your Join type
       *
       * - `SINGLE` - will result into a single ref entity object
       * - `MULTIPLE` - will result in a list of ref entities
       */
      type: 'MULTIPLE';

      /**
       * Custom sort your entity list
       */
      sorter?: Sorter;
    };

type EntityJoinType = EntityDepthParams['type'];

type SingleJoinConfig = EntityDepthParams & {
  /**
   *
   * @param item Entity to be joined
   * @returns the actual value of the entity
   *
   * Use this if you need to parse the returned entity before it gets added to the parent
   */
  extractor?: (item: any) => any;

  /**
   * Entity that the join should look for
   */
  entity: RefEntity;
} & JoinResolutionParams;

type JoinConfig = SingleJoinConfig & { join?: Record<string, SingleJoinConfig> };

type BaseJoinConfig = {
  // Allow it to also be Entity or [Entity]
  [key: string]: JoinConfig;
};

type ConfiguredJoin<Config extends JoinConfig> = JoinResolutionParams & {
  type: Config['type'];

  ref: Config['entity']['type'];
} & SorterProps<Config> &
  ExtractorProps<Config> &
  (Config['join'] extends JoinConfig ? { join: ConfiguredJoin<Config['join']> } : object);

export type PartitionCollectionParams<TableConfig extends SingleTableConfig> = EntityDepthParams & {
  /**
   * Root entity.
   *
   * If `null` the base entry will be an empty object with the `join` keys added
   */
  ref: RefEntity | null;

  /**
   * Collection join config. Each key here will be added to the ref entity
   */
  join: BaseJoinConfig;

  /**
   * If you would like to narrow the collection query. Options available:
   *
   * - `RANGE_KEY` - RangeKey will required the base entity RangeKey parameters and only retrieve items that have that as starting string
   * - `Function` - Define a custom range narrower for your collection
   */
  narrowBy?: 'RANGE_KEY' | ((...params: any[]) => DefinedNameRangeKeyConfig);
} & PartitionRefParams<TableConfig>;

type SingleOrArray<Entity, Type extends EntityJoinType> = Type extends 'SINGLE'
  ? PrettifyObject<Entity>
  : Array<PrettifyObject<Entity>>;

type BuildJoinType<Config extends BaseJoinConfig> = {
  [Key in keyof Config]: SingleOrArray<
    (Config[Key]['extractor'] extends Extractor
      ? ReturnType<Config[Key]['extractor']>
      : Config[Key]['entity']['__entity']) &
      (Config[Key]['join'] extends BaseJoinConfig
        ? BuildJoinType<Config[Key]['join']>
        : Config[Key]['extractor'] extends Extractor // makes sure we dont end up with like number & object = never
        ? ReturnType<Config[Key]['extractor']>
        : object),
    Config[Key]['type']
  >;
};

type CollectionType<Params extends PartitionCollectionParams<any>> = SingleOrArray<
  (Params['ref'] extends RefEntity ? Params['ref']['__entity'] : object) &
    BuildJoinType<Params['join']>,
  Params['type']
>;

type IndexResultParams<Params> = Params extends { index: any }
  ? Pick<Params, 'index'>
  : Params extends { partition: { index: any } }
  ? { index: Params['partition']['index'] }
  : object;

export type PartitionCollection<Params extends PartitionCollectionParams<any>> = Pick<
  Params,
  'type' | 'narrowBy'
> &
  IndexResultParams<Params> &
  SorterProps<Params> & {
    getPartitionKey: Params['partition'] extends HasPartitionKey
      ? Params['partition']['getPartitionKey']
      : NonNullable<Params['getPartitionKey']>;

    /**
     * The entity type, if applicable
     */
    startRef: Params['ref'] extends RefEntity ? Params['ref']['type'] : null;

    /**
     * Root entity of the collection
     */
    originEntity: Params['ref'];

    /**
     * Collection join configured
     */
    join: {
      [Key in keyof Params['join']]: ConfiguredJoin<Params['join'][Key]>;
    };

    /**
     * Facilitator type, do not access
     */
    __type: CollectionType<Params>;

    /**
     * Specifies which DB instance this is
     */
    __dbType: 'COLLECTION';
  };

function createCollectionJoin<Config extends BaseJoinConfig>(
  config: Config,
): {
  [Key in keyof Config]: ConfiguredJoin<Config[Key]>;
} {
  return Object.fromEntries(
    Object.entries(config).map(([key, { entity, join, method = 'POSITION', ...params }]) => [
      key,
      { ...params, method, ref: entity.type, join: join ? createCollectionJoin(join) : undefined },
    ]),
  ) as unknown as {
    [Key in keyof Config]: ConfiguredJoin<Config[Key]>;
  };
}

export type ExtendableCollection = PartitionCollection<any>;

export type GetCollectionType<Collection extends ExtendableCollection> = Collection['__type'];

export function createCollection<Params extends PartitionCollectionParams<any>>({
  join,
  ref,
  type,
  getPartitionKey,
  partition,
  narrowBy,
  ...config
}: Params): PartitionCollection<Params> {
  return {
    ...({
      index: (partition as any)?.index || (config as any).index,
    } as IndexResultParams<Params>),

    ...(pick(config as any, ['sorter']) as SorterProps<Params>),

    __type: {} as CollectionType<Params>,

    __dbType: 'COLLECTION',

    getPartitionKey: getPartitionKey ?? partition.getPartitionKey,

    type,

    startRef: (ref?.type ?? null) as PartitionCollection<Params>['startRef'],

    originEntity: ref,

    join: createCollectionJoin(join as Params['join']),

    narrowBy,
  };
}
