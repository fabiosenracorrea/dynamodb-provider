/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBConfig } from './types';

/**
 * DynamoDB V3 Commands always have their params on an 'input' field.
 *
 * Its why when we test for the get/delete etc calls, we verify
 * if the correct method was called with the correct params
 */
class FakeCommand {
  public input: any;

  constructor(input: any) {
    this.input = input;
  }
}

export const fakeDBCommands = {
  BatchGetCommand: FakeCommand,
  GetCommand: FakeCommand,
  DeleteCommand: FakeCommand,
  PutCommand: FakeCommand,
  UpdateCommand: FakeCommand,
  ScanCommand: FakeCommand,
  QueryCommand: FakeCommand,
  TransactWriteCommand: FakeCommand,
} as unknown as Extract<DynamoDBConfig, { target: 'v3' }>['commands'];
