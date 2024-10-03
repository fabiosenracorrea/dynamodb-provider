/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableMethods, SingleTableParams } from 'singleTable/adaptor';
import { ExtendableSingleTableEntity, IndexMapping } from 'singleTable/model';
import { SingleTableGetParams, singleTableParams } from 'singleTable/adaptor/definitions';
import { AnyObject } from 'types';
import { pick } from 'utils/object';
import {
  FromEntity,
  IndexQueryMethods,
  ListEntityMethods,
  PartitionQueryMethods,
} from './definitions';

export class SingleTableFromEntity<SingleParams extends SingleTableParams> {
  private methods: SingleTableMethods<SingleParams>;

  private config: SingleParams;

  constructor(params: SingleParams) {
    this.config = params;
    this.methods = new SingleTableMethods(params);
  }

  private bindObjectMethods<E extends AnyObject>(object: E): E {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        typeof value === 'function' ? value.bind(this) : value,
      ]),
    ) as E;
  }

  private buildEntityQuery<Registered extends ExtendableSingleTableEntity>(
    entity: Registered,
  ): PartitionQueryMethods<Registered> {
    const callers = {
      custom: (config = {} as any) =>
        this.methods.query({
          ...(pick(config || {}, singleTableParams as any) as any),

          partition: entity.getPartitionKey(config),
        }),

      ...Object.fromEntries(
        Object.entries((entity as any).rangeQueries ?? {}).map(([rangeQueryName, paramGetter]) => [
          rangeQueryName,
          (queryParams = {} as any) =>
            this.methods.query({
              ...(pick(queryParams || {}, singleTableParams as any) as any),

              partition: entity.getPartitionKey(queryParams),

              range: typeof paramGetter === 'function' ? paramGetter(queryParams) : null,
            } as any),
        ]),
      ),
    } as PartitionQueryMethods<Registered>;

    return this.bindObjectMethods(callers);
  }

  private getQueryIndexMethods<Entity extends ExtendableSingleTableEntity>(
    entity: Entity,
  ): IndexQueryMethods<ExtendableSingleTableEntity> {
    const typed = entity as {
      indexes?: IndexMapping<SingleParams & { indexes: any }, Entity['__entity']>;
    };

    if (!typed.indexes) return {};

    const queryIndex = {
      ...Object.fromEntries(
        Object.entries(typed.indexes).map(([index, indexConfig]) => [
          index,

          this.bindObjectMethods({
            custom: async (params = {}) =>
              this.methods.query({
                ...(pick(params || {}, singleTableParams as any) as any),

                index: indexConfig.index,

                partition: indexConfig.getPartitionKey(params as any),
              }),

            ...Object.fromEntries(
              Object.entries((indexConfig.rangeQueries as any) ?? {}).map(
                ([rangeQueryName, paramGetter]) => [
                  rangeQueryName,

                  async (queryParams = {}) =>
                    this.methods.query({
                      ...(pick(queryParams || {}, singleTableParams as any) as any),

                      index: indexConfig.index,

                      partition: indexConfig.getPartitionKey(queryParams as any),

                      range: typeof paramGetter === 'function' ? paramGetter(queryParams) : null,
                    }),
                ],
              ),
            ),
          }),
        ]),
      ),
    };

    return {
      queryIndex,
    };
  }

  private getTypeListingParams<Registered extends ExtendableSingleTableEntity>(
    entity: Registered,
  ): ListEntityMethods<Registered, SingleParams> {
    if (!this.config.typeIndex) return {} as ListEntityMethods<Registered, SingleParams>;

    return {
      listAll: () => this.methods.listAllFromType(entity.type),

      list: (params = {}) =>
        this.methods.listType({
          type: entity.type,

          ...params,
        }),
    } as ListEntityMethods<Registered, SingleParams>;
  }

  fromEntity<Entity extends ExtendableSingleTableEntity>(
    entity: Entity,
  ): FromEntity<Entity, SingleParams> {
    const methods = {
      get: ((params = {}) =>
        this.methods.get({ ...params, ...entity.getKey(params) } as SingleTableGetParams<
          Entity['__entity']
        >)) as FromEntity<Entity, SingleParams>['get'],

      batchGet: (({ keys, ...options }) =>
        this.methods.batchGet({
          ...options,
          keys: keys.map(entity.getKey),
        })) as FromEntity<Entity, SingleParams>['batchGet'],

      create: ((...p) =>
        this.methods.create((entity as any).getCreationParams(...p))) as FromEntity<
        Entity,
        SingleParams
      >['create'],

      delete: ((params) =>
        this.methods.delete({ ...params, ...entity.getKey(params) })) as FromEntity<
        Entity,
        SingleParams
      >['delete'],

      update: (async (params) => {
        await this.methods.update(entity.getUpdateParams(params));
      }) as FromEntity<Entity, SingleParams>['update'],

      query: this.buildEntityQuery(entity),

      ...this.getTypeListingParams(entity),

      ...(this.getQueryIndexMethods(entity) as IndexQueryMethods<Entity>),
    };

    return this.bindObjectMethods(methods);
  }
}
