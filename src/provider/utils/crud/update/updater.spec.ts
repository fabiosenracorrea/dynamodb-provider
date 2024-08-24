/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  buildConditionExpression,
  getConditionExpressionNames,
  getConditionExpressionValues,
} from '../../conditions';
import { ItemUpdater } from './updater';

// simple helper to not bother mocking print log
const toJSON = (v: any): string => JSON.stringify(v, null, 2);

describe('Updater tests', () => {
  describe('update action', () => {
    it('should properly call dynamodb update operation', async () => {
      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,
        } as any,
      });

      await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name: 'Fabio',
        },
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression: 'SET #name = :name',

        ExpressionAttributeNames: {
          '#name': 'name',
        },

        ExpressionAttributeValues: {
          ':name': 'Fabio',
        },
      });
    });

    it('should log dynamodb params if option is passed', async () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const updater = new ItemUpdater({
        logCallParams: true,

        dynamoDB: {
          update: () => ({
            promise: () => ({}),
          }),
        } as any,
      });

      await updater.update<any>({
        table: 'table',
        key: {
          id: '23023',
          hello: 'lalal',
        },
        values: {
          name: 'fabio',
        },
      });

      expect(consoleLogMock).toHaveBeenCalledWith(
        toJSON({
          TableName: 'table',

          Key: {
            id: '23023',
            hello: 'lalal',
          },

          UpdateExpression: 'SET #name = :name',

          ExpressionAttributeNames: {
            '#name': 'name',
          },

          ExpressionAttributeValues: {
            ':name': 'fabio',
          },
        }),
      );
    });

    it('should properly create dynamoDB sets on set operations', async () => {
      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const createSet = (v: any) => ({
        value: v,
        isSet: true,
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,

          createSet,
        } as any,
      });

      await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        atomicOperations: [
          {
            property: 'setAdd',
            type: 'add_to_set',
            value: 1,
          },
          {
            property: 'removeSet',
            type: 'remove_from_set',
            value: '1',
          },
        ],
      });

      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression: 'ADD #setAdd :setAdd DELETE #removeSet :removeSet',

        ExpressionAttributeNames: {
          '#setAdd': 'setAdd',
          '#removeSet': 'removeSet',
        },

        ExpressionAttributeValues: {
          ':setAdd': createSet([1]),
          ':removeSet': createSet(['1']),
        },
      });
    });

    it('should properly adjust for conditions', async () => {
      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,
        } as any,
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'exists' as const,
          property: 'list',
        },
      ];

      await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name: 'Fabio',
        },

        conditions,
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression: 'SET #name = :name',

        ConditionExpression: buildConditionExpression(conditions),

        ExpressionAttributeNames: {
          '#name': 'name',
          ...getConditionExpressionNames(conditions),
        },

        ExpressionAttributeValues: {
          ':name': 'Fabio',
          ...getConditionExpressionValues(conditions),
        },
      });
    });

    it('should properly call dynamodb update operation in complex update scenarios', async () => {
      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,

          createSet: (v: any) => v,
        } as any,
      });

      await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name: '1das',
          age: 13,
        },

        remove: ['removeProp1', 'removeProp2'],

        atomicOperations: [
          {
            property: 'prop',
            type: 'sum',
            value: 100,
          },
          {
            property: 'other',
            type: 'add',
            value: 1,
          },
          {
            property: 'set',
            type: 'set_if_not_exists',
            refProperty: 'refSet',
            value: '10',
          },
          {
            property: 'setAdd',
            type: 'add_to_set',
            value: 1,
          },
          {
            property: 'removeSet',
            type: 'remove_from_set',
            value: '1',
          },
        ],
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression:
          'SET #name = :name, #age = :age, #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet REMOVE #removeProp1, #removeProp2',

        ExpressionAttributeNames: {
          '#name': 'name',
          '#age': 'age',
          '#prop': 'prop',
          '#set': 'set',
          '#refSet': 'refSet',
          '#other': 'other',
          '#setAdd': 'setAdd',
          '#removeSet': 'removeSet',
          '#removeProp1': 'removeProp1',
          '#removeProp2': 'removeProp2',
        },

        ExpressionAttributeValues: {
          ':name': '1das',
          ':age': 13,
          ':prop': 100,
          ':set': '10',
          ':other': 1,
          ':setAdd': [1],
          ':removeSet': ['1'],
        },
      });
    });

    it('should properly call dynamodb update operation in complex update scenarios with conditions', async () => {
      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,

          createSet: (v: any) => v,
        } as any,
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'exists' as const,
          property: 'list',
        },
      ];

      await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name: '1das',
          age: 13,
        },

        conditions,

        remove: ['removeProp1', 'removeProp2'],

        atomicOperations: [
          {
            property: 'prop',
            type: 'sum',
            value: 100,
          },
          {
            property: 'other',
            type: 'add',
            value: 1,
          },
          {
            property: 'set',
            type: 'set_if_not_exists',
            refProperty: 'refSet',
            value: '10',
          },
          {
            property: 'setAdd',
            type: 'add_to_set',
            value: 1,
          },
          {
            property: 'removeSet',
            type: 'remove_from_set',
            value: '1',
          },
        ],
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression:
          'SET #name = :name, #age = :age, #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet REMOVE #removeProp1, #removeProp2',

        ConditionExpression: buildConditionExpression(conditions),

        ExpressionAttributeNames: {
          '#name': 'name',
          '#age': 'age',
          '#prop': 'prop',
          '#set': 'set',
          '#refSet': 'refSet',
          '#other': 'other',
          '#setAdd': 'setAdd',
          '#removeSet': 'removeSet',
          '#removeProp1': 'removeProp1',
          '#removeProp2': 'removeProp2',
          ...getConditionExpressionNames(conditions),
        },

        ExpressionAttributeValues: {
          ':name': '1das',
          ':age': 13,
          ':prop': 100,
          ':set': '10',
          ':other': 1,
          ':setAdd': [1],
          ':removeSet': ['1'],
          ...getConditionExpressionValues(conditions),
        },
      });
    });

    it('should return the updated values if indicated so', async () => {
      const name = 'Fabio';
      const age = 24;

      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Attributes: {
            name,
            age,
          },
        }),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,
        } as any,
      });

      const result = await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name,
          age,
        },

        returnUpdatedProperties: true,
      });

      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression: 'SET #name = :name, #age = :age',

        ExpressionAttributeNames: {
          '#name': 'name',
          '#age': 'age',
        },

        ExpressionAttributeValues: {
          ':name': name,
          ':age': age,
        },

        ReturnValues: 'UPDATED_NEW',
      });

      expect(result).toStrictEqual({
        name,
        age,
      });
    });

    it('should NOT return the updated values if not explicitly passed', async () => {
      const name = 'Fabio';
      const age = 24;

      const updateMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Attributes: {
            name,
            age,
          },
        }),
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          update: updateMock,
        } as any,
      });

      const result = await updater.update<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name,
          age,
        },
      });

      expect(updateMock).toHaveBeenCalledWith({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression: 'SET #name = :name, #age = :age',

        ExpressionAttributeNames: {
          '#name': 'name',
          '#age': 'age',
        },

        ExpressionAttributeValues: {
          ':name': name,
          ':age': age,
        },
      });

      expect(result).toBe(undefined);
    });
  });

  describe('getUpdateParams tests', () => {
    describe('validation checks - same as ./validation - double ensure its executed', () => {
      describe('key validation', () => {
        it('should allow 1 property key updates', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
              },

              table: 'table',

              values: {
                some: 'sss',
              },
            });
          };

          expect(caller).not.toThrow();
        });

        it('should allow 2 property key updates', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'ss',
                name: 'ssss',
              },

              table: 'table',

              values: {
                some: 'sss',
              },
            });
          };

          expect(caller).not.toThrow();
        });

        it('should not allow more than 2 property key updates', () => {
          [3, 10, 20, 100].forEach((keyCount) => {
            const updater = new ItemUpdater({
              dynamoDB: {} as any,
            });

            const caller = () => {
              updater.getUpdateParams<any>({
                key: Object.fromEntries(
                  Array.from({ length: keyCount }, (_, i) => [`prop${i}`, `prop${i}`]),
                ),

                table: 'table',

                values: {
                  some: 'sss',
                },
              });
            };

            expect(caller).toThrow();
          });
        });
      });

      describe('key references inside updates', () => {
        it('should not allow key properties to be referenced in *values*', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {
                id: 'sss',
                some: 'sss',
              },
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow key properties to be referenced in *remove*', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              remove: ['name'] as unknown as any,

              values: {
                some: 'sss',
              },
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow key properties to be referenced in *atomics*', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {
                some: 'sss',
              },

              atomicOperations: [
                {
                  property: 'name',
                  type: 'add_to_set',
                  value: '1',
                },
              ],
            });
          };

          expect(caller).toThrow();
        });
      });

      describe('update references passed', () => {
        it('should not allow params without all 3 of values, remove and atomic', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow allow empty update references', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {},
              remove: [],
              atomicOperations: [],
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow duplicate reference of properties between values and remove', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              remove: ['some'] as unknown as any,

              values: {
                some: 'sss',
              },
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow duplicate reference of properties between values and atomic', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {
                some: 'sss',
              },

              atomicOperations: [
                {
                  property: 'some',
                  type: 'add',
                  value: 1,
                },
              ],
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow duplicate reference of properties between remove and atomic', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              remove: ['some'] as unknown as any,

              atomicOperations: [
                {
                  property: 'some',
                  type: 'add',
                  value: 1,
                },
              ],
            });
          };

          expect(caller).toThrow();
        });

        it('should not allow duplicate reference of properties between remove and atomic and values', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {
                some: 'sss',
              },

              remove: ['some'] as unknown as any,

              atomicOperations: [
                {
                  property: 'some',
                  type: 'add',
                  value: 1,
                },
              ],
            });
          };

          expect(caller).toThrow();
        });
      });

      describe('conditions', () => {
        it('should not allow the same property to be reference on multiple conditions', () => {
          const updater = new ItemUpdater({
            dynamoDB: {} as any,
          });

          const caller = () => {
            updater.getUpdateParams<any>({
              key: {
                id: 'sss',
                name: 'sss',
              },

              table: 'table',

              values: {
                some: 'q',
              },

              atomicOperations: [
                {
                  property: 'other',
                  type: 'remove_from_set',
                  value: '1',
                },
                {
                  property: 'other',
                  type: 'add_to_set',
                  value: '3',
                },
              ],
            });
          };

          expect(caller).toThrow();
        });
      });
    });

    describe('handle a complex scenario', () => {
      const createSet = (v: any) => ({
        value: v,
        isSet: true,
      });

      const updater = new ItemUpdater({
        dynamoDB: {
          createSet,
        } as any,
      });

      const conditions = [
        {
          operation: 'equal' as const,
          value: 20,
          property: 'some',
        },
        {
          operation: 'exists' as const,
          property: 'list',
        },
      ];

      const params = updater.getUpdateParams<any>({
        table: 'table',

        key: {
          id: '23023',
          hello: 'lalal',
        },

        values: {
          name: '1das',
          age: 13,
        },

        conditions,

        remove: ['removeProp1', 'removeProp2'],

        atomicOperations: [
          {
            property: 'prop',
            type: 'sum',
            value: 100,
          },
          {
            property: 'other',
            type: 'add',
            value: 1,
          },
          {
            property: 'set',
            type: 'set_if_not_exists',
            refProperty: 'refSet',
            value: '10',
          },
          {
            property: 'setAdd',
            type: 'add_to_set',
            value: 1,
          },
          {
            property: 'removeSet',
            type: 'remove_from_set',
            value: '1',
          },
        ],
      });

      expect(params).toStrictEqual({
        TableName: 'table',

        Key: {
          id: '23023',
          hello: 'lalal',
        },

        UpdateExpression:
          'SET #name = :name, #age = :age, #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet REMOVE #removeProp1, #removeProp2',

        ConditionExpression: buildConditionExpression(conditions),

        ExpressionAttributeNames: {
          '#name': 'name',
          '#age': 'age',
          '#prop': 'prop',
          '#set': 'set',
          '#refSet': 'refSet',
          '#other': 'other',
          '#setAdd': 'setAdd',
          '#removeSet': 'removeSet',
          '#removeProp1': 'removeProp1',
          '#removeProp2': 'removeProp2',
          ...getConditionExpressionNames(conditions),
        },

        ExpressionAttributeValues: {
          ':name': '1das',
          ':age': 13,
          ':prop': 100,
          ':set': '10',
          ':other': 1,
          ':setAdd': createSet([1]),
          ':removeSet': createSet(['1']),
          ...getConditionExpressionValues(conditions),
        },
      });
    });
  });
});
