import { ValidateTransactParams } from 'provider/utils';

import { BaseSingleTableOperator, SingleTableOperatorParams } from '../../executor';
import { SingleTableCreator, SingleTableRemover, SingleTableUpdater } from '../crud';

import { SingleTableTransactionConfig, SingleTableValidateTransactParams } from './types';
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

  async executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void> {
    await this.db.executeTransaction(
      (configs.filter(Boolean) as SingleTableTransactionConfig[]).map(
        ({ create, erase, update, validate }) => {
          if (erase) return { erase: { ...this.remover.getDeleteParams(erase) } };

          if (create) return { create: { ...this.creator.getCreateParams(create) } };

          if (update) return { update: { ...this.updater.getUpdateParams(update) } };

          if (validate) return { validate: this.getValidateParams(validate) };

          throw new Error('Invalid transaction type');
        },
      ),
    );
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (
      item: Item,
    ) => (SingleTableTransactionConfig | null)[] | SingleTableTransactionConfig | null,
  ): SingleTableTransactionConfig[] {
    return items
      .map((item) => generator(item))
      .flat()
      .filter(Boolean) as SingleTableTransactionConfig[];
  }
}
