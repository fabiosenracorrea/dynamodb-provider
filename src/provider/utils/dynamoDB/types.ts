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
} from '@aws-sdk/lib-dynamodb';

type DynamoV2 = DynamoDBv2.DocumentClient;

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
        BatchGetCommand: BatchGetCommand;
        GetCommand: GetCommand;
        DeleteCommand: DeleteCommand;
        PutCommand: PutCommand;
        UpdateCommand: UpdateCommand;
        ScanCommand: ScanCommand;
        QueryCommand: QueryCommand;
        TransactWriteCommand: TransactWriteCommand;
      };
    };

interface ScanOutput<Entity> extends Omit<DynamoDBv2.DocumentClient.ScanOutput, 'Items'> {
  Items: Entity[];
}

interface QueryOutput<Entity> extends Omit<DynamoDBv2.DocumentClient.QueryOutput, 'Items'> {
  Items?: Entity[];
}

interface GetItemOutput<Entity> extends Omit<DynamoDBv2.DocumentClient.GetItemOutput, 'Item'> {
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

export type DBDeleteItemParams = {
  input: DynamoDBv2.DocumentClient.DeleteItemInput;
  output: DynamoDBv2.DocumentClient.DeleteItemOutput;
};

export type DBCreateItemParams = {
  input: DynamoDBv2.DocumentClient.PutItemInput;
  output: DynamoDBv2.DocumentClient.PutItemOutput;
};

export type DBUpdateItemParams = {
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

type DBV2Set =
  | {
      type: 'String';
      values: string[];
    }
  | {
      type: 'Number';
      values: number[];
    };

type DBV3Set = Set<string> | Set<number>;

export type DBSet = DBV2Set | DBV3Set;
