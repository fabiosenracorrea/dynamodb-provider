import { IDatabaseProvider } from 'provider';

import { SingleTableConfig } from './config';

export interface SingleTableOperatorParams {
  db: IDatabaseProvider;

  config: SingleTableConfig;
}
