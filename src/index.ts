/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { DynamodbProvider } from './provider';

interface Person {
  id: string;
  name: string;
  age: number;
  address: string;
  zip: string;
}

export async function testProviderTyping() {
  const db = new DynamodbProvider();

  const items = await db.query<Person>({
    table: 'hello',
    hashKey: {
      name: 'name',
      value: 'id',
    },
    rangeKey: {
      name: 'zip',
      operation: 'begins_with',
      value: '1',
    },
  });
}
