/* eslint-disable @typescript-eslint/no-explicit-any */
import { IDynamodbProvider } from 'provider';

import { SingleTableConfig } from './config';

export interface SingleTableOperatorParams {
  db: IDynamodbProvider;

  config: SingleTableConfig;

  parser?: (item: any) => any;
}

export class BaseSingleTableOperator {
  protected db: SingleTableOperatorParams['db'];

  protected config: SingleTableOperatorParams['config'];

  protected parser?: (item: any) => any;

  constructor({ config, db, parser }: SingleTableOperatorParams) {
    this.db = db;
    this.config = config;
    this.parser = parser;
  }
}
