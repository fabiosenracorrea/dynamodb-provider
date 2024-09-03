/* eslint-disable @typescript-eslint/no-explicit-any */

import { printLog } from 'utils/log';

import {
  DynamoDBConfig,
  DynamoDBV2Actions,
  BatchGetCommand,
  DBBatchGetParams,
  DBGetParams,
  GetCommand,
  DBDeleteItemParams,
  DeleteCommand,
  DBCreateItemParams,
  PutCommand,
  DBUpdateItemParams,
  UpdateCommand,
  DBSet,
  DBScanParams,
  ScanCommand,
  DBQueryParams,
  QueryCommand,
  DBTransactWriteParams,
  TransactWriteCommand,
} from './types';

export type ExecutorParams = {
  dynamoDB: DynamoDBConfig;

  logCallParams?: boolean;
};

interface ExecuteParams {
  v2: DynamoDBV2Actions;
  Command: any;
  params: any;
}

export class DynamodbExecutor {
  protected dynamoDB: ExecutorParams['dynamoDB'];

  protected options: Pick<ExecutorParams, 'logCallParams'>;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;
    this.options = options;
  }

  private async execute({ Command, params, v2 }: ExecuteParams): Promise<any> {
    if (this.options.logCallParams) printLog(params, `${v2} - dynamodb call params`);

    const { instance, target } = this.dynamoDB;

    if (target === 'v2') return instance[v2](params).promise();

    return instance.send(new Command(params));
  }

  protected async _batchGetItems(
    params: DBBatchGetParams['input'],
  ): Promise<DBBatchGetParams['output']> {
    return this.execute({
      params,
      Command: BatchGetCommand,
      v2: 'batchGet',
    });
  }

  protected async _scanTable<Entity>(
    params: DBScanParams<Entity>['input'],
  ): Promise<DBScanParams<Entity>['output']> {
    return this.execute({
      params,
      Command: ScanCommand,
      v2: 'scan',
    });
  }

  protected async _query<Entity>(
    params: DBQueryParams<Entity>['input'],
  ): Promise<DBQueryParams<Entity>['output']> {
    return this.execute({
      params,
      Command: QueryCommand,
      v2: 'query',
    });
  }

  protected async _getItem<Entity>(
    params: DBGetParams<Entity>['input'],
  ): Promise<DBGetParams<Entity>['output']> {
    return this.execute({
      params,
      Command: GetCommand,
      v2: 'get',
    });
  }

  protected async _deleteItem(
    params: DBDeleteItemParams['input'],
  ): Promise<DBDeleteItemParams['output']> {
    return this.execute({
      params,
      Command: DeleteCommand,
      v2: 'delete',
    });
  }

  protected async _insertItem(
    params: DBCreateItemParams['input'],
  ): Promise<DBCreateItemParams['output']> {
    return this.execute({
      params,
      Command: PutCommand,
      v2: 'put',
    });
  }

  protected async _updateItem(
    params: DBUpdateItemParams['input'],
  ): Promise<DBUpdateItemParams['output']> {
    return this.execute({
      params,
      Command: UpdateCommand,
      v2: 'update',
    });
  }

  protected async _transactionWrite(
    params: DBTransactWriteParams['input'],
  ): Promise<DBTransactWriteParams['output']> {
    return this.execute({
      params,
      Command: TransactWriteCommand,
      v2: 'transactWrite',
    });
  }

  protected createSet(items: string[] | number[]): DBSet {
    if (this.dynamoDB.target === 'v2') return this.dynamoDB.instance.createSet(items) as DBSet;

    return new Set(items as any[]);
  }
}
