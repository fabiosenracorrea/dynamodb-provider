/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { validateUpdateParams } from './validate';

describe('Update params validator', () => {
  describe('key validation', () => {
    it('should allow 1 property key updates', () => {
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
        const caller = () => {
          validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
      const caller = () => {
        validateUpdateParams({
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
