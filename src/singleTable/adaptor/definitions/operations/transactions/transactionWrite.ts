/* eslint-disable @typescript-eslint/no-explicit-any */

import { TransactionParams, ValidateTransactParams } from 'provider/utils';

import { BaseSingleTableOperator, SingleTableOperatorParams } from '../../executor';
import { SingleTableCreator, SingleTableRemover, SingleTableUpdater } from '../crud';

import { SingleTableTransactionParams, SingleTableValidateTransactParams } from './types';
import { getPrimaryKey } from '../../key';

interface SingleTableTransactorParams extends SingleTableOperatorParams {
  creator?: SingleTableCreator;

  updater?: SingleTableUpdater;

  remover?: SingleTableRemover;
}

export class SingleTableTransactionWriter extends BaseSingleTableOperator {
  private creator: SingleTableCreator;

  private updater: SingleTableUpdater;

  private remover: SingleTableRemover;

  constructor({ creator, updater, remover, ...params }: SingleTableTransactorParams) {
    super(params);

    this.creator = creator ?? new SingleTableCreator(params);

    this.updater = updater ?? new SingleTableUpdater(params);

    this.remover = remover ?? new SingleTableRemover(params);
  }

  private getValidateParams({
    conditions,
    partitionKey,
    rangeKey,
  }: SingleTableValidateTransactParams): ValidateTransactParams {
    return {
      conditions,

      table: this.config.table,

      key: getPrimaryKey(
        {
          partitionKey,
          rangeKey,
        },
        this.config,
      ),
    };
  }

  ejectTransactParams(
    configs: (SingleTableTransactionParams | null)[],
  ): TransactionParams[] {
    return (configs.filter(Boolean) as SingleTableTransactionParams[]).map(
      ({ create, erase, update, validate }) => {
        if (erase) return { erase: { ...this.remover.getDeleteParams(erase) } };

        if (create) return { create: { ...this.creator.getCreateParams(create as any) } };

        if (update) return { update: { ...this.updater.getUpdateParams(update) } };

        if (validate) return { validate: this.getValidateParams(validate) };

        throw new Error('Invalid transaction type');
      },
    ) as TransactionParams[];
  }

  async transaction(configs: (SingleTableTransactionParams | null)[]): Promise<void> {
    await this.db.transaction(
      this.ejectTransactParams(configs),
      //
    );
  }

  toTransactionParams<Item>(
    items: Item[],
    generator: (
      item: Item,
    ) => (SingleTableTransactionParams | null)[] | SingleTableTransactionParams | null,
  ): SingleTableTransactionParams[] {
    return items
      .map((item) => generator(item))
      .flat()
      .filter(Boolean) as SingleTableTransactionParams[];
  }
}
