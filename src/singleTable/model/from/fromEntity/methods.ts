/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableMethods, type SingleTableParams } from 'singleTable/adaptor';
import type { AnyEntity, IndexMapping } from 'singleTable/model';
import {
  type SingleTableGetParams,
  singleTableQueryParams,
} from 'singleTable/adaptor/definitions';
import type { AnyFunction, AnyObject } from 'types';

import { pick } from 'utils/object';

import type {
  FromEntity,
  IndexQueryMethods,
  ListEntityMethods,
  QueryMethods,
  QueryRef,
} from './definitions';

export class SingleTableFromEntityMethods<
  Entity extends AnyEntity,
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

  private toQueryCallers(getPartitionKey: AnyFunction, extraParams = {}) {
    const custom = (config = {} as any) =>
      this.methods.query({
        ...pick(config || {}, singleTableQueryParams),

        ...extraParams,

        partition: getPartitionKey(config),
      });

    const one = (config = {} as any) =>
      this.methods.queryOne({
        ...pick(config || {}, singleTableQueryParams),

        ...extraParams,

        partition: getPartitionKey(config),
      } as any);

    const all = (config = {} as any) =>
      this.methods.queryAll({
        ...pick(config || {}, singleTableQueryParams),

        ...extraParams,

        partition: getPartitionKey(config),
      } as any);

    return this.bindObjectMethods({
      custom,
      one,
      all,
    });
  }

  private toCustomRangeCaller(
    getPartitionKey: AnyFunction,
    rangeGetter?: AnyFunction,
    extraParams = {},
  ) {
    const caller = (queryParams = {} as any) =>
      this.methods.query({
        ...pick(queryParams || {}, singleTableQueryParams),
        ...extraParams,

        partition: getPartitionKey(queryParams),

        range: rangeGetter?.(queryParams) ?? null,
      });

    const extraCallers = this.toQueryCallers(getPartitionKey);

    caller.one = extraCallers.one;
    caller.all = extraCallers.all;

    return caller.bind(this);
  }

  private buildQuery<T extends QueryRef & { index?: PropertyKey }>({
    getPartitionKey,
    rangeQueries,
    index,
  }: T) {
    const extraParams = index ? { index } : {};

    return {
      // binds happen inside...
      ...this.toQueryCallers(getPartitionKey, extraParams),

      ...Object.fromEntries(
        Object.entries(rangeQueries ?? {}).map(([rangeQueryName, paramGetter]) => [
          rangeQueryName,
          this.toCustomRangeCaller(
            getPartitionKey,
            paramGetter as AnyFunction,
            extraParams,
          ),
        ]),
      ),
    } as QueryMethods<T, Entity['__entity']>;
  }

  private getQueryIndexMethods(): IndexQueryMethods<AnyEntity> {
    const typed = this.entity as {
      indexes?: IndexMapping<SingleParams & { indexes: any }, any>;
    };

    if (!typed.indexes) return {};

    const queryIndex = {
      ...Object.fromEntries(
        Object.entries(typed.indexes).map(([index, indexConfig]) => [
          index,

          this.buildQuery(indexConfig),
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

      delete: ((params = {}) =>
        this.methods.delete({ ...params, ...entity.getKey(params) })) as FromEntity<
        Entity,
        SingleParams
      >['delete'],

      update: ((params) =>
        this.methods.update(entity.getUpdateParams(params))) as FromEntity<
        Entity,
        SingleParams
      >['update'],

      query: this.buildQuery(entity),

      ...this.getTypeListingParams(),

      ...(this.getQueryIndexMethods() as IndexQueryMethods<Entity>),
    };

    return this.bindObjectMethods(methods);
  }
}
