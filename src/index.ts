/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { SingleTableProvider } from 'singleTable/adaptor/implementation';

interface Person {
  id: string;
  name: string;
  age: number;
  address: string;
  zip: string;
}

export async function testProviderTyping() {
  const db = new SingleTableProvider({
    table: 'table',
    partitionKey: '_pk',
    rangeKey: '_sk',
    expiresAt: '_expires',
  });
}
