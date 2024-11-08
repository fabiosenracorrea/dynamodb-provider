/* eslint-disable @typescript-eslint/no-explicit-any */

import { printLog } from 'utils/log';

import {
  DynamoDBConfig,
  DynamoDBV2Actions,
  DBBatchGetParams,
  DBGetParams,
  DBDeleteItemParams,
  DBCreateItemParams,
  DBUpdateItemParams,
  DBSet,
  DBScanParams,
  DBQueryParams,
  DBTransactWriteParams,
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
      Command: this.dynamoDB.commands?.BatchGetCommand,
      v2: 'batchGet',
    });
  }

  protected async _scanTable<Entity>(
    params: DBScanParams<Entity>['input'],
  ): Promise<DBScanParams<Entity>['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.ScanCommand,
      v2: 'scan',
    });
  }

  protected async _query<Entity>(
    params: DBQueryParams<Entity>['input'],
  ): Promise<DBQueryParams<Entity>['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.QueryCommand,
      v2: 'query',
    });
  }

  protected async _getItem<Entity>(
    params: DBGetParams<Entity>['input'],
  ): Promise<DBGetParams<Entity>['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.GetCommand,
      v2: 'get',
    });
  }

  protected async _deleteItem(
    params: DBDeleteItemParams['input'],
  ): Promise<DBDeleteItemParams['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.DeleteCommand,
      v2: 'delete',
    });
  }

  protected async _insertItem(
    params: DBCreateItemParams['input'],
  ): Promise<DBCreateItemParams['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.PutCommand,
      v2: 'put',
    });
  }

  protected async _updateItem(
    params: DBUpdateItemParams['input'],
  ): Promise<DBUpdateItemParams['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.UpdateCommand,
      v2: 'update',
    });
  }

  protected async _transactionWrite(
    params: DBTransactWriteParams['input'],
  ): Promise<DBTransactWriteParams['output']> {
    return this.execute({
      params,
      Command: this.dynamoDB.commands?.TransactWriteCommand,
      v2: 'transactWrite',
    });
  }

  protected _createSet<T extends string[] | number[]>(items: T): DBSet<T[number], 'v2' | 'v3'> {
    if (this.dynamoDB.target === 'v3') return new Set(items as any[]);

    return this.dynamoDB.instance.createSet(items) as any as DBSet<T[number], 'v2' | 'v3'>;
  }
}
