import { SingleTableConfig } from '../../config';
import { SingleTableKeyReference } from '../../key';

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

type IndexParamsForUpdate<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['indexes']
    ? unknown
    : {
        /**
         * Explicity describe each relevant index value to update
         * You can chose to update just a partition/range
         */
        indexes?: {
          [key in keyof TableConfig['indexes']]?: Partial<SingleTableKeyReference>;
        };
      };

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
