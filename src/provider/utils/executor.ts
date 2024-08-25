import { DynamoDB } from 'aws-sdk';

export type ExecutorParams = {
  dynamoDB: DynamoDB.DocumentClient;

  logCallParams?: boolean;
};
