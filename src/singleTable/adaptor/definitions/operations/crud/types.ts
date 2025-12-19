/* eslint-disable @typescript-eslint/no-explicit-any */
import { AtomicMath } from 'provider/utils/crud/update/atomic';
import { IsNever, StableOmit } from 'types';
import { SingleTableConfig } from '../../config';
import { SingleTableKeyReference } from '../../key';
import { NumericIndex } from '../../tableIndex';

type IndexParamsForCreate<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['indexes']
    ? unknown
    : {
        /**
         * Explicity describe each relevant index value on this creation, if applicable
         */
        indexes?: {
          [key in keyof TableConfig['indexes']]?: SingleTableKeyReference;
        };
      };

export type BaseAtomicIndexUpdate<Indexes extends PropertyKey> = StableOmit<
  AtomicMath<Record<Indexes, string>>,
  'property'
> & {
  index: Indexes;
};

export type AtomicIndexUpdate<Indexes extends NonNullable<SingleTableConfig['indexes']>> =
  BaseAtomicIndexUpdate<NumericIndex<Indexes>>;

type AtomicIndexParams<Indexes extends NonNullable<SingleTableConfig['indexes']>> =
  IsNever<NumericIndex<Indexes>> extends true
    ? unknown
    : { atomicIndexes?: AtomicIndexUpdate<Indexes>[] };

type IndexParamsForUpdate<TableConfig extends SingleTableConfig> = TableConfig extends {
  indexes: any;
}
  ? {
      /**
       * Explicity describe each relevant index value to update
       * You can chose to update just a partition/range
       */
      indexes?: {
        [key in keyof TableConfig['indexes']]?: Partial<SingleTableKeyReference>;
      };
    } & AtomicIndexParams<TableConfig['indexes']>
  : unknown;

type ExpiresAtParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['expiresAt']
    ? unknown
    : {
        /**
         * The UNIX timestamp expiration of this item
         */
        expiresAt?: number;
      };

type TypeParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['typeIndex']
    ? unknown
    : {
        /**
         * The entity type
         *
         * This will be assigned the to column described
         * in your config.typeIndex.partitionKey
         */
        type: string;
      };

export type ParamsByTableConfigForCreate<TableConfig extends SingleTableConfig> =
  IndexParamsForCreate<TableConfig> &
    ExpiresAtParams<TableConfig> &
    TypeParams<TableConfig>;

export type ParamsByTableConfigForUpdate<TableConfig extends SingleTableConfig> =
  IndexParamsForUpdate<TableConfig> &
    ExpiresAtParams<TableConfig> &
    TypeParams<TableConfig>;
