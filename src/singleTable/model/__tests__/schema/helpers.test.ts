export const tableConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dynamodbProvider: {} as any,
  partitionKey: 'hello',
  rangeKey: 'key',

  table: 'my-table',

  typeIndex: {
    name: 'TypeIndexName',
    partitionKey: '_type',
    rangeKey: '_ts',
  },

  expiresAt: '_expires',

  indexes: {
    someIndex: {
      partitionKey: '_indexHash1',
      rangeKey: '_indexRange1',
    },

    anotherIndex: {
      partitionKey: '_indexHash2',
      rangeKey: '_indexRange2',
    },

    yetAnotherIndex: {
      partitionKey: '_indexHash3',
      rangeKey: '_indexRange3',
    },
  },
};

export interface User {
  name: string;
  id: string;
  email: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt?: string;
}
