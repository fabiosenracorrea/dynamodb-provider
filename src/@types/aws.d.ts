import { DynamoDB } from 'aws-sdk';

declare module 'aws-sdk' {
  export interface ScanOutput<Entity> extends Omit<DynamoDB.DocumentClient.ScanOutput, 'Items'> {
    Items: Entity[];
  }

  export interface QueryOutput<Entity> extends Omit<DynamoDB.DocumentClient.QueryOutput, 'Items'> {
    Items?: Entity[];
  }

  export interface PutItemInput<Entity> extends Omit<DynamoDB.DocumentClient.PutItemInput, 'Item'> {
    Item: Entity;
  }

  export interface GetItemOutput<Entity>
    extends Omit<DynamoDB.DocumentClient.GetItemOutput, 'Item'> {
    Item?: Entity;
  }
}
