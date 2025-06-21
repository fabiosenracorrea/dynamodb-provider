import { AnyObject, StringKey } from 'types';

import { DBSet, QueryResult, TransactionConfig } from 'provider';

import { omit } from 'utils/object';
import {
  SingleTableMethods,
  SingleTableParams,
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  SingleTableCreateItemParams,
  SingleTableGetParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableDeleteParams,
  SingleTableTransactConfigGenerator,
} from './adaptor';
import { SingleTableSchema as FullSingleTableSchema, SingleTableSchemaType } from './model';

export class SingleTable<SingleParams extends SingleTableParams> {
  private methods: SingleTableMethods<SingleParams>;

  private fullSchema: FullSingleTableSchema<SingleParams>;

  public schema: SingleTableSchemaType<SingleParams>;

  config: Omit<SingleParams, 'dynamodbProvider'>;

  constructor(params: SingleParams) {
    this.config = omit(params, ['dynamodbProvider']);

    this.methods = new SingleTableMethods(params);

    this.fullSchema = new FullSingleTableSchema(params);

    this.schema = {
      createEntity: this.fullSchema.createEntity.bind(this.fullSchema),
      createPartition: this.fullSchema.createPartition.bind(this.fullSchema),
      createCollection: this.fullSchema.createCollection.bind(this.fullSchema),
      getEntityByType: this.fullSchema.getEntityByType.bind(this.fullSchema),
      from: this.fullSchema.from.bind(this.fullSchema),
      fromCollection: this.fullSchema.fromCollection.bind(this.fullSchema),
      fromEntity: this.fullSchema.fromEntity.bind(this.fullSchema),
    };
  }

  async get<Entity = AnyObject>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    return this.methods.get(params);
  }

  async create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.methods.create(params as any);
  }

  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.methods.update(params);
  }

  async delete<Entity = AnyObject>(params: SingleTableDeleteParams<Entity>): Promise<void> {
    await this.methods.delete(params);
  }

  async batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.methods.batchGet<Entity, PKs>(params);
  }

  async query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.methods.query(params as any);
  }

  /**
   *  Useful if you need to merge transactions from other tables
   */
  ejectTransactParams(configs: (SingleTableTransactionConfig | null)[]): TransactionConfig[] {
    return this.methods.ejectTransactParams(configs);
  }

  async executeTransaction(
    configs: (SingleTableTransactionConfig<SingleParams> | null)[],
  ): Promise<void> {
    return this.methods.executeTransaction(configs);
  }

  generateTransactionConfigList<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionConfig<SingleParams, Item>[] {
    return this.methods.generateTransactionConfigList(
      items,
      generator,
    ) as SingleTableTransactionConfig<SingleParams, Item>[];
  }

  createSet<T extends string[] | number[]>(
    items: T,
  ): DBSet<T[number], SingleParams['dynamodbProvider']['target']> {
    return this.methods.createSet(items);
  }

  async listAllFromType<Entity = AnyObject>(type: string): Promise<Entity[]> {
    return this.methods.listAllFromType(type);
  }

  async listType<Entity = AnyObject>(
    params: ListItemTypeParams,
  ): Promise<ListItemTypeResult<Entity>> {
    return this.methods.listType(params);
  }

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined {
    return this.methods.findTableItem(items, type);
  }

  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[] {
    return this.methods.filterTableItens(items, type);
  }
}
