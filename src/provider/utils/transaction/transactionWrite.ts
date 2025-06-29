/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { printLog } from 'utils/log';

import {
  DBConditionTransactParams,
  DBTransactWriteParams,
  DynamodbExecutor,
  ExecutorParams,
} from '../dynamoDB';

import { TransactionConfig, ValidateTransactParams } from './types';
import { getConditionParams } from '../conditions';
import { ItemCreator, ItemRemover, ItemUpdater } from '../crud';

const MAX_TRANSACT_ACTIONS = 100;

export class TransactionWriter extends DynamodbExecutor {
  private creator: ItemCreator;

  private remover: ItemRemover;

  private updater: ItemUpdater;

  constructor(params: ExecutorParams) {
    super(params);

    this.creator = new ItemCreator(params);

    this.remover = new ItemRemover(params);

    this.updater = new ItemUpdater(params);
  }

  private _getConditionCheckParams({
    conditions,
    key,
    table,
  }: ValidateTransactParams): DBConditionTransactParams {
    return {
      TableName: table,

      Key: key,

      ...getConditionParams(conditions),
    } as DBConditionTransactParams;
  }

  private _getTransactParams(configs: TransactionConfig[]): DBTransactWriteParams['input'] {
    const params = configs.map(({ create, erase, update, validate }) => {
      if (update) return { Update: this.updater.getUpdateParams(update) };

      if (erase) return { Delete: this.remover.getDeleteParams(erase) };

      if (create) return { Put: this.creator.getCreateParams(create) };

      if (validate) return { ConditionCheck: this._getConditionCheckParams(validate) };

      throw new Error('Unknown transact type');
    });

    const actualParams = params.filter(Boolean);

    return { TransactItems: actualParams } as DBTransactWriteParams['input'];
  }

  private async executeSingleTransaction(configs: TransactionConfig[]): Promise<void> {
    if (this.options.logCallParams) printLog(configs, 'TRANSACT WRITE PARAMS');

    const params = this._getTransactParams(configs);

    try {
      await this._transactionWrite(params);
    } catch (err) {
      const error = err as any;

      if (this.options.logCallParams && error.CancellationReasons)
        printLog(error.CancellationReasons, 'TRANSACT_CANCELATION_REASONS');

      throw err;
    }
  }

  // Should be an argument
  // private validateTransactions(configs: TransactionConfig[]): void {
  //   const params = this._getTransactParams(configs);

  //   const itemKeys = params.TransactItems.map(({ Delete, Put, Update }) => {
  //     const modifier = Update ?? Delete;

  //     if (modifier) return `${modifier.Key._pk}--${modifier.Key._sk}`;

  //     if (Put) return `${Put.Item._pk}--${Put.Item._sk}`;

  //     throw new Error('Invalid Transaction');
  //   });

  //   const uniqueKeys = Array.from(new Set(itemKeys));

  //   printLog({ uniqueKeys, itemKeys });

  //   if (uniqueKeys.length !== configs.length)
  //     throw new Error('MULTIPLE OPERATIONS ON THE SAME ITEM FOUND...');
  // }

  async transaction(configs: (TransactionConfig | null)[]): Promise<void> {
    const validConfigs = configs.filter(Boolean) as TransactionConfig[];

    if (!validConfigs.length) return console.log('EMPTY TRANSACTION RESOLVED');

    if (configs.length > MAX_TRANSACT_ACTIONS)
      throw new Error(`Max supported transaction size is ${MAX_TRANSACT_ACTIONS}`);

    await this.executeSingleTransaction(validConfigs);
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[] | TransactionConfig | null,
  ): TransactionConfig[] {
    return items
      .map((item) => generator(item))
      .flat()
      .filter(Boolean) as TransactionConfig[];
  }
}
