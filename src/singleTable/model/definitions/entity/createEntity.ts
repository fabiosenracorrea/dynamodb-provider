/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { SingleTableConfig } from 'singleTable/adaptor';

import { resolveKeys } from '../key';
import { getRangeQueriesParams } from '../range';

import { getCRUDParamGetters } from './crud';
import { SingleTableEntity } from './entity';
import { getEntityIndexParams } from './indexParams';
import { RegisterEntityParams } from './params';
import { getEntityParserProps } from './parsers';

export function createEntity<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
>(tableConfig: TableConfig, params: Params): SingleTableEntity<TableConfig, Entity, Params> {
  const keyParams = resolveKeys(params);

  const indexParams = getEntityIndexParams(tableConfig, params);

  const entity = {
    type: params.type,

    ...keyParams,

    ...indexParams,

    ...getRangeQueriesParams(params),

    ...getCRUDParamGetters(tableConfig, {
      ...params,
      ...keyParams,
      ...indexParams,
    } as any),

    ...getEntityParserProps(params as any),

    __dbType: 'ENTITY',
  };

  return entity as SingleTableEntity<TableConfig, Entity, Params>;
}
