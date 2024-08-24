import { DynamoDB } from 'aws-sdk';
import { StringKey } from 'types';

export type EntityPK<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = PKs extends StringKey<Entity> ? { [K in PKs]: Entity[K] } : Partial<Entity>;

export type ExecutorParams = {
  dynamoDB: DynamoDB.DocumentClient;

  logCallParams?: boolean;
};
