/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, PrettifyObject } from 'types/general';
import { PartitionRefParams } from './entity/partition';
import { TableIndex } from '../config';
import { RegisterEntityParams, RegisteredEntity } from './entity';
import { Partition } from './partition';
import { DefinedNameRangeKeyConfig } from '../definitions';

type EntityJoinType = 'SINGLE' | 'MULTIPLE';

export type Sorter = (a: any, b: any) => number;
export type Extractor<E = any> = (a: E) => any;

type SorterProps<Params extends { sorter?: Sorter }> = Params['sorter'] extends Sorter
  ? { sorter: Params['sorter'] }
  : object;

type ExtractorProps<Params extends { extractor?: Extractor }> =
  Params['extractor'] extends Extractor ? { extractor: Params['extractor'] } : object;

// resolver = needs a function to receive a item => true if its part of the join
// position = we get every TYPE of the item to join the parent until a new parent-type is found

type EntityJoinMethod = 'RESOLVER' | 'POSITION' | 'BY_TYPE'; // DEFAULT IS POSITION

type JoinResolver<Parent = AnyObject, Child = AnyObject> = (
  parent: Parent,
  possibleChild: Child,
) => boolean;

export type JoinResolutionParams = {
  method?: EntityJoinMethod;
  resolver?: JoinResolver;
};

type SingleJoinConfig = {
  type: EntityJoinType;

  sorter?: Sorter;

  extractor?: (item: any) => any;

  entity: RegisteredEntity<any, RegisterEntityParams<any>>;
} & JoinResolutionParams;

type JoinConfig = SingleJoinConfig & { join?: Record<string, SingleJoinConfig> };

type BaseJoinConfig = {
  [key: string]: JoinConfig;
};

type ConfiguredJoin<Config extends JoinConfig> = JoinResolutionParams & {
  type: Config['type'];

  ref: Config['entity']['type'];
} & SorterProps<Config> &
  ExtractorProps<Config> &
  (Config['join'] extends JoinConfig ? { join: ConfiguredJoin<Config['join']> } : object);

type RefEntity = RegisteredEntity<any, RegisterEntityParams<any>>;

export type PartitionCollectionParams = {
  index?: TableIndex;

  type: EntityJoinType;

  sorter?: Sorter;

  ref: RefEntity | null;

  join: BaseJoinConfig;

  narrow?: 'RANGE_KEY' | ((...params: any[]) => DefinedNameRangeKeyConfig);
} & PartitionRefParams<any>;

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

type CollectionType<Params extends PartitionCollectionParams> = SingleOrArray<
  (Params['ref'] extends RefEntity ? Params['ref']['__entity'] : object) &
    BuildJoinType<Params['join']>,
  Params['type']
>;

export type PartitionCollection<Params extends PartitionCollectionParams> = Pick<
  Params,
  'index' | 'type' | 'narrow'
> &
  SorterProps<Params> & {
    getPartitionKey: Params['partition'] extends Partition<any>
      ? Params['partition']['getPartitionKey']
      : NonNullable<Params['getPartitionKey']>;

    startRef: Params['ref'] extends RefEntity ? Params['ref']['type'] : null;

    originEntity: Params['ref'];

    join: {
      [Key in keyof Params['join']]: ConfiguredJoin<Params['join'][Key]>;
    };

    __type: CollectionType<Params>;
  };

export type ExtendablePartitionCollection = PartitionCollection<any>;

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

export type TypeFromCollection<Collection extends ExtendablePartitionCollection> =
  Collection['__type'];

export function createCollection<Params extends PartitionCollectionParams>({
  join,
  ref,
  type,
  getPartitionKey,
  index,
  partition,
  narrow,
  sorter,
}: Params): PartitionCollection<Params> {
  return {
    __type: {} as CollectionType<Params>,

    index,

    getPartitionKey: getPartitionKey ?? partition.getPartitionKey,

    type,

    startRef: (ref?.type ?? null) as PartitionCollection<Params>['startRef'],

    originEntity: ref,

    join: createCollectionJoin(join as Params['join']),

    sorter,

    narrow,
  };
}
