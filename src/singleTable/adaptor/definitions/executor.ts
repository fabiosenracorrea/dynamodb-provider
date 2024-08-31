import { IDatabaseProvider } from 'provider';

import { SingleTableConfig } from './config';

export interface SingleTableOperatorParams {
  db: IDatabaseProvider;

  config: SingleTableConfig;
}

export class BaseSingleTableOperator {
  protected db: SingleTableOperatorParams['db'];

  protected config: SingleTableOperatorParams['config'];

  constructor({ config, db }: SingleTableOperatorParams) {
    this.db = db;
    this.config = config;
  }
}
