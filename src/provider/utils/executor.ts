import { DynamoDB } from 'aws-sdk';

export type ExecutorParams = {
  dynamoDB: DynamoDB.DocumentClient;

  logCallParams?: boolean;
};

export class DynamodbExecutor {
  protected dynamoDB: ExecutorParams['dynamoDB'];

  protected options: Pick<ExecutorParams, 'logCallParams'>;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;
    this.options = options;
  }
}
