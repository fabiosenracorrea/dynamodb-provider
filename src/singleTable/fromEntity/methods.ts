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

export class SingleTableFromEntityMethods<
  Entity extends ExtendableSingleTableEntity,
  SingleParams extends SingleTableParams,
> {
  private entity: Entity;

  private methods: SingleTableMethods<SingleParams & { parser?: (item: any) => any }>;

  private config: SingleParams;

  constructor(entity: Entity, params: SingleParams) {
    this.config = params;
    this.entity = entity;
    this.methods = new SingleTableMethods(params, { parser: entity.parser });
  }

  private bindObjectMethods<E extends AnyObject>(object: E): E {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        typeof value === 'function' ? value.bind(this) : value,
      ]),
    ) as E;
  }

  private buildEntityQuery(): PartitionQueryMethods<Entity> {
    const callers = {
      custom: (config = {} as any) =>
        this.methods.query({
          ...(pick(config || {}, singleTableParams as any) as any),

          partition: this.entity.getPartitionKey(config),
        }),

      ...Object.fromEntries(
        Object.entries((this.entity as any).rangeQueries ?? {}).map(
          ([rangeQueryName, paramGetter]) => [
            rangeQueryName,
            (queryParams = {} as any) =>
              this.methods.query({
                ...(pick(queryParams || {}, singleTableParams as any) as any),

                partition: this.entity.getPartitionKey(queryParams),

                range: typeof paramGetter === 'function' ? paramGetter(queryParams) : null,
              } as any),
          ],
        ),
      ),
    } as PartitionQueryMethods<Entity>;

    return this.bindObjectMethods(callers);
  }

  private getQueryIndexMethods(): IndexQueryMethods<ExtendableSingleTableEntity> {
    const typed = this.entity as {
      indexes?: IndexMapping<SingleParams & { indexes: any }, any>;
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

  private getTypeListingParams(): ListEntityMethods<Entity, SingleParams> {
    if (!this.config.typeIndex) return {} as ListEntityMethods<Entity, SingleParams>;

    return {
      listAll: () => this.methods.listAllFromType(this.entity.type),

      list: (params = {}) =>
        this.methods.listType({
          type: this.entity.type,

          ...params,
        }),
    } as ListEntityMethods<Entity, SingleParams>;
  }

  buildMethods(): FromEntity<Entity, SingleParams> {
    const { entity } = this;

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

      query: this.buildEntityQuery(),

      ...this.getTypeListingParams(),

      ...(this.getQueryIndexMethods() as IndexQueryMethods<Entity>),
    };

    return this.bindObjectMethods(methods);
  }
}
