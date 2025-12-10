/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyObject } from 'types';

import { cascadeEval } from 'utils/conditions';

import { SingleTableMethods, SingleTableParams } from 'singleTable/adaptor';
import type {
  BaseJoinConfig,
  AnyCollection,
  Extractor,
  JoinResolutionParams,
  Sorter,
} from 'singleTable/model';
import { resolveProps } from 'singleTable/adaptor/definitions/parsers';

import { getFirstItem, getLastIndex } from 'utils/array';
import { getId } from 'utils/id';
import { FromCollection, GetCollectionResult } from './definitions';
import { buildCollectionEntityMap, EntityMap } from './utils';

export class SingleTableFromCollection<SingleParams extends SingleTableParams> {
  private methods: SingleTableMethods<
    SingleParams & { keepTypeProperty: true; autoRemoveTableProperties: false }
  >;

  private config: SingleParams;

  constructor(params: SingleParams) {
    this.config = params;

    this.methods = new SingleTableMethods({
      ...params,
      // Necessary for narrowing
      keepTypeProperty: true,
      autoRemoveTableProperties: false,
    });
  }

  private bindObjectMethods<E extends AnyObject>(object: E): E {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        typeof value === 'function' ? value.bind(this) : value,
      ]),
    ) as E;
  }

  private getTypeProp(): string {
    return this.config.typeIndex?.partitionKey ?? getId('UUID');
  }

  private findMatching({
    childType,
    joinBy,
    options,
    parent,
    mapping,
  }: {
    parent: AnyObject;
    options: AnyObject[];
    childType: string;
    mapping: Record<string, AnyObject[]>;
  } & Required<Pick<JoinResolutionParams, 'joinBy'>>): AnyObject[] {
    if (joinBy === 'TYPE') return mapping[childType] ?? [];

    if (typeof joinBy === 'function')
      return mapping[childType].filter(
        // (option) => option[typeProp] === childType && resolver?.(parent, option),
        (option) => joinBy(parent, option),
      );

    const typeProp = this.getTypeProp();
    const pkProp = this.config.partitionKey;
    const skProp = this.config.rangeKey;

    const BAD_INDEX = -1;

    // ref: null joins
    const nullParent = !parent[skProp];

    // find parent position
    // find next parent type position
    // slice option, filter all by Type

    const parentIndex = nullParent
      ? 0
      : options.findIndex(
          (option) =>
            parent[pkProp] === option[pkProp] && parent[skProp] === option[skProp],
        );

    if (parentIndex < 0 || parentIndex > getLastIndex(options)) return [];

    const nextParentTypeIndex = options.findIndex(
      (option, index) => index > parentIndex && option[typeProp] === parent[typeProp],
    );

    const actualNextParentIndex =
      nextParentTypeIndex === BAD_INDEX ? options.length : nextParentTypeIndex + 1;

    const children = options
      .slice(parentIndex, actualNextParentIndex)
      .filter((option) => option[typeProp] === childType);

    return children;
  }

  private cleanCollectionChildren(
    children: AnyObject | AnyObject[] | undefined | null,
    sorter?: (a: any, b: any) => number,
  ): AnyObject | AnyObject[] | null {
    if (!children) return null;

    const isList = Array.isArray(children);

    const isPrimitive = typeof (isList ? getFirstItem(children) : children) !== 'object';

    if (isPrimitive) return children;

    return isList ? this.applySort(children, sorter) : children;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applySort<Entity>(
    list: Entity[],
    sorter?: (a: any, b: any) => number,
  ): Entity[] {
    if (!sorter) return list;

    return list.slice().sort(sorter);
  }

  private buildJoin({
    item,
    join,
    mapping,
    options,
  }: {
    item: AnyObject;
    options: AnyObject[]; // all the options available to be joined
    join: AnyCollection['join'];
    mapping: Record<string, AnyObject[]>; // byType to easily reduce times if joinBy is BY TYPE
  }): AnyObject {
    const joinProps = Object.fromEntries(
      Object.entries(join)
        .map(([prop, config]) => {
          const {
            ref,
            type,
            joinBy = 'POSITION',
            join: childJoin,
            sorter,
            extractor,
          } = config as typeof config & {
            join?: AnyCollection['join'];
            sorter?: Sorter;
            extractor?: Extractor;
          };

          const joinOptions = this.findMatching({
            childType: ref,
            mapping,
            options,
            parent: item,
            joinBy,
          });

          const childrenBase =
            type === 'SINGLE' ? getFirstItem(joinOptions) : joinOptions;

          const children = cascadeEval([
            {
              is: Array.isArray(childrenBase),
              then: () => [childrenBase].flat().map((c) => extractor?.(c) ?? c),
            },
            {
              is: childrenBase,
              then: () => extractor?.(childrenBase) ?? childrenBase,
            },
            {
              is: true,
              then: null,
            },
          ]);

          if (typeof children !== 'object') return [prop, children];

          if (!childJoin || !children)
            return [prop, this.cleanCollectionChildren(children, sorter)];

          const furtherJoined = Array.isArray(children)
            ? this.applySort(
                children.map((child) =>
                  this.buildJoin({
                    item: child,
                    mapping,
                    join: childJoin,
                    options,
                  }),
                ),
                sorter,
              )
            : this.buildJoin({
                item: children,
                mapping,
                join: childJoin,
                options,
              });

          return [prop, furtherJoined];
        })
        .filter(([, value]) => value),
    );

    return {
      ...item,

      ...joinProps,
    };
  }

  private cleanSingleCollectionEntry<Item extends AnyObject | AnyObject[]>(
    result: Item,
    joinRef: BaseJoinConfig | undefined,
    entityMap: EntityMap,
  ): Item {
    if (typeof result !== 'object' || result === null) return result;

    if (Array.isArray(result))
      return result.map((singleItem) =>
        this.cleanSingleCollectionEntry(singleItem, joinRef, entityMap),
      ) as Item;

    return {
      ...resolveProps(
        result,
        this.config,
        entityMap[result[this.config.typeIndex?.partitionKey || ''] || '']?.parser,
      ),

      ...Object.fromEntries(
        Object.entries(joinRef ?? {}).map(([propName, { join }]) => [
          propName,
          this.cleanSingleCollectionEntry(result[propName], join, entityMap),
        ]),
      ),
    };
  }

  private cleanCollectionProps<Result extends AnyObject | AnyObject[]>(
    result: Result,
    collection: AnyCollection,
  ): Result {
    return this.cleanSingleCollectionEntry(
      result,
      collection.join,
      buildCollectionEntityMap(collection),
    );
  }

  private buildCollection<Collection extends AnyCollection>(
    collection: Collection,
    items: AnyObject[],
  ): GetCollectionResult<Collection> {
    const { join, startRef, type, ...params } = collection;

    const typeProp = this.getTypeProp();

    const byType = items.reduce(
      (acc, next) => ({
        ...acc,

        [next[typeProp]]: [...(acc[next[typeProp]] ?? []), next],
      }),
      {} as Record<string, AnyObject[]>,
    );

    const start =
      type === 'MULTIPLE' ? byType[startRef] ?? [] : getFirstItem(byType[startRef] ?? []);

    if (type === 'SINGLE' && startRef && !start)
      return undefined as GetCollectionResult<Collection>;

    const isList = Array.isArray(start);

    const joined = isList
      ? this.applySort(
          start.map((item) =>
            this.buildJoin({
              item,
              mapping: byType,
              join,
              options: items,
            }),
          ),
          (params as { sorter?: Sorter }).sorter,
        )
      : this.buildJoin({
          item: start ?? {},
          mapping: byType,
          join,
          options: items,
        });

    return this.cleanCollectionProps(joined, collection);
  }

  private async getPartitionCollection<Collection extends AnyCollection>(
    collection: Collection,
    ...params: Parameters<FromCollection<Collection>['get']>
  ): Promise<GetCollectionResult<Collection>> {
    const [config] = params;

    const { items } = await this.methods.query({
      ...(config ?? {}),

      partition: collection.getPartitionKey(config),

      // more complex extractions later
      fullRetrieval: true,

      index: (collection as any).index,

      range: cascadeEval([
        {
          is: collection.narrowBy === 'RANGE_KEY' && collection.originEntity,

          then: () => ({
            operation: 'begins_with',
            value: collection.originEntity.getRangeKey(config),
          }),
        },
        {
          is: typeof collection.narrowBy === 'function',
          then: () => collection.narrowBy(config),
        },
        {
          is: true,
          then: undefined,
        },
      ]),
    });

    return this.buildCollection(collection, items);
  }

  fromCollection<Collection extends AnyCollection>(
    collection: Collection,
  ): FromCollection<Collection> {
    const methods: FromCollection<Collection> = {
      get: (...params) => this.getPartitionCollection(collection, ...params),
    };

    return this.bindObjectMethods(methods);
  }
}
