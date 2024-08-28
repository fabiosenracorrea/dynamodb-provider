/* eslint-disable no-console */
import { DynamoDB } from 'aws-sdk';
import { printLog } from 'utils/log';
import { ExecutorParams } from '../executor';
import { TransactionConfig, ValidateTransactParams } from './types';
import { buildExpression, getExpressionNames } from '../expressions';
import { getConditionExpressionValues } from '../conditions';
import { ItemCreator, ItemRemover, ItemUpdater } from '../crud';

const MAX_TRANSACT_ACTIONS = 100;

export class TransactionWriter {
  private dynamoDB: ExecutorParams['dynamoDB'];

  private options: Pick<ExecutorParams, 'logCallParams'>;

  private creator: ItemCreator;

  private remover: ItemRemover;

  private updater: ItemUpdater;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;

    this.options = options;

    this.creator = new ItemCreator({
      dynamoDB,
      ...options,
    });

    this.remover = new ItemRemover({
      dynamoDB,
      ...options,
    });

    this.updater = new ItemUpdater({
      dynamoDB,
      ...options,
    });
  }

  private async _transactionWrite(
    params: DynamoDB.DocumentClient.TransactWriteItemsInput,
  ): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> {
    return this.dynamoDB.transactWrite(params).promise();
  }

  private _getConditionCheckParams({
    conditions,
    key,
    table,
  }: ValidateTransactParams): DynamoDB.DocumentClient.ConditionCheck {
    return {
      TableName: table,

      Key: key,

      ConditionExpression: buildExpression(conditions),

      ExpressionAttributeNames: getExpressionNames(conditions.map(({ property }) => property)),

      ExpressionAttributeValues: getConditionExpressionValues(conditions),
    };
  }

  private _getTransactParams(
    configs: TransactionConfig[],
  ): DynamoDB.DocumentClient.TransactWriteItemsInput {
    const params = configs.map(({ create, erase, update, validate }) => {
      if (update) return { Update: this.updater.getUpdateParams(update) };

      if (erase) return { Delete: this.remover.getDeleteParams(erase) };

      if (create) return { Put: this.creator.getCreateParams(create) };

      if (validate) return { ConditionCheck: this._getConditionCheckParams(validate) };

      throw new Error('Unknown transact type');
    });

    const actualParams = params.filter(Boolean);

    return { TransactItems: actualParams } as DynamoDB.DocumentClient.TransactWriteItemsInput;
  }

  private async executeSingleTransaction(configs: TransactionConfig[]): Promise<void> {
    if (this.options.logCallParams) printLog(configs, 'TRANSACT WRITE PARAMS');

    const params = this._getTransactParams(configs);

    if (this.options.logCallParams) printLog(params, 'DYNAMODB LOW LEVEL TRANSACTION PARAMS');

    await this._transactionWrite(params);
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

  async executeTransaction(configs: (TransactionConfig | null)[]): Promise<void> {
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
