/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */

import { DynamoDB as DynamoDBv2 } from 'aws-sdk';

import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  DeleteCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
  TransactWriteCommand,
  BatchGetCommandInput,
  DeleteCommandInput,
  UpdateCommandInput,
  QueryCommandInput,
  TransactWriteCommandInput,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';

type DynamoV2 = DynamoDBv2.DocumentClient;

type CommandConstructor<TCommand, TInput = any> = new (input: TInput) => TCommand;

export type DynamoDBV2Actions = Extract<
  keyof DynamoV2,
  'scan' | 'get' | 'batchGet' | 'transactWrite' | 'update' | 'delete' | 'put' | 'query'
>;

export type DynamoDBConfig =
  | {
      target: 'v2';
      instance: DynamoV2;
      commands?: never;
    }
  | {
      target: 'v3';
      instance: DynamoDBDocumentClient;
      commands: {
        BatchGetCommand: CommandConstructor<BatchGetCommand, BatchGetCommandInput>;
        GetCommand: CommandConstructor<GetCommand, GetCommandInput>;
        DeleteCommand: CommandConstructor<DeleteCommand, DeleteCommandInput>;
        PutCommand: CommandConstructor<PutCommand>;
        UpdateCommand: CommandConstructor<UpdateCommand, UpdateCommandInput>;
        ScanCommand: CommandConstructor<ScanCommand>;
        QueryCommand: CommandConstructor<QueryCommand, QueryCommandInput>;
        TransactWriteCommand: CommandConstructor<
          TransactWriteCommand,
          TransactWriteCommandInput
        >;
      };
    };

interface ScanOutput<Entity> extends Omit<DynamoDBv2.DocumentClient.ScanOutput, 'Items'> {
  Items: Entity[];
}

interface QueryOutput<Entity>
  extends Omit<DynamoDBv2.DocumentClient.QueryOutput, 'Items'> {
  Items?: Entity[];
}

interface GetItemOutput<Entity>
  extends Omit<DynamoDBv2.DocumentClient.GetItemOutput, 'Item'> {
  Item?: Entity;
}

export type DBBatchGetParams = {
  input: DynamoDBv2.DocumentClient.BatchGetItemInput;
  output: DynamoDBv2.DocumentClient.BatchGetItemOutput;
};

export type DBGetParams<Entity> = {
  input: DynamoDBv2.DocumentClient.GetItemInput;
  output: GetItemOutput<Entity>;
};

export type DBQueryParams<Entity> = {
  input: DynamoDBv2.DocumentClient.QueryInput;
  output: QueryOutput<Entity>;
};

export type DBDeleteParams = {
  input: DynamoDBv2.DocumentClient.DeleteItemInput;
  output: DynamoDBv2.DocumentClient.DeleteItemOutput;
};

export type DBCreateParams = {
  input: DynamoDBv2.DocumentClient.PutItemInput;
  output: DynamoDBv2.DocumentClient.PutItemOutput;
};

export type DBUpdateParams = {
  input: DynamoDBv2.DocumentClient.UpdateItemInput;
  output: DynamoDBv2.DocumentClient.UpdateItemOutput;
};

export type DBScanParams<Entity> = {
  input: DynamoDBv2.DocumentClient.ScanInput;
  output: ScanOutput<Entity>;
};

export type DBTransactWriteParams = {
  input: DynamoDBv2.DocumentClient.TransactWriteItemsInput;
  output: DynamoDBv2.DocumentClient.TransactWriteItemsOutput;
};

export type DBConditionTransactParams = DynamoDBv2.DocumentClient.ConditionCheck;

export type DBConditionParams = Pick<
  // It does not matter which input we reference these from
  DynamoDBv2.DocumentClient.PutItemInput,
  'ConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
>;

export type DBFilterParams = Pick<
  // It does not matter which input we reference these from
  DynamoDBv2.DocumentClient.ScanInput,
  'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
>;

export type DBProjectionParams = Pick<
  // It does not matter which input we reference these from
  DynamoDBv2.DocumentClient.ScanInput,
  'ProjectionExpression' | 'ExpressionAttributeNames'
>;

export type DBV2Set<T extends string | number> = T extends number
  ? {
      type: 'Number';
      values: number[];
    }
  : {
      type: 'String';
      values: string[];
    };

export type DBV3Set<T extends string | number> = T extends number
  ? Set<number>
  : Set<string>;

/**
 * The type your set items will be retrieved as.
 *
 * **WARNING** It varies depending on aws sdk version you choose
 */
export type DBSet<
  T extends string | number,
  DbSDKVersion extends DynamoDBConfig['target'],
> = DbSDKVersion extends 'v2' ? DBV2Set<T> : DbSDKVersion extends 'v3' ? DBV3Set<T> : any;
