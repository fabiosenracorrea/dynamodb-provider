import { cleanInternalProps, cleanInternalPropsFromList } from './propRemoval';

describe('single table adaptor - prop cleaner helpers', () => {
  describe('cleanInternalProps', () => {
    it('should remove internal props by default', () => {
      const result = cleanInternalProps(
        {
          _pk: 'some',
          _sk: 'other',
          _type: 'SOME_TYPE',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          indexes: {
            SomeIndex: {
              partitionKey: '_indexHash1',
              rangeKey: '_indexRange1',
            },
          },
        },
      );

      expect(result).toStrictEqual({
        id: '1',
        name: 'some',
        other: 'prop',
      });
    });

    it('should keep type property if defined', () => {
      const result = cleanInternalProps(
        {
          _pk: 'some',
          _sk: 'other',
          _type: 'SOME_TYPE',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          keepTypeProperty: true,
          indexes: {
            SomeIndex: {
              partitionKey: '_indexHash1',
              rangeKey: '_indexRange1',
            },
          },
        },
      );

      expect(result).toStrictEqual({
        id: '1',
        name: 'some',
        other: 'prop',
        _type: 'SOME_TYPE',
      });
    });

    it('should not remove if explicity defined', () => {
      const result = cleanInternalProps(
        {
          _pk: 'some',
          _sk: 'other',
          _type: 'SOME_TYPE',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          autoRemoveTableProperties: false,
        },
      );

      expect(result).toStrictEqual({
        _pk: 'some',
        _sk: 'other',
        _type: 'SOME_TYPE',
        _ts: '123',
        id: '1',
        name: 'some',
        other: 'prop',
      });
    });

    it('should use remover cb if present', () => {
      const result = cleanInternalProps(
        {
          _pk: 'some',
          _sk: 'other',
          _type: 'SOME_TYPE',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          propertyCleanup: ({ _sk, _ts, ...item }) => item,
        },
      );

      expect(result).toStrictEqual({
        _pk: 'some',
        _type: 'SOME_TYPE',
        id: '1',
        name: 'some',
        other: 'prop',
      });
    });
  });

  describe('cleanInternalPropsFromList', () => {
    it('should remove internal props by default', () => {
      const result = cleanInternalPropsFromList(
        [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
        ],
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          indexes: {
            SomeIndex: {
              partitionKey: '_indexHash1',
              rangeKey: '_indexRange1',
            },
          },
        },
      );

      expect(result).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
        },
      ]);
    });

    it('should keep type property if defined', () => {
      const result = cleanInternalPropsFromList(
        [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
        ],
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          keepTypeProperty: true,
        },
      );

      expect(result).toStrictEqual([
        {
          id: '1',
          name: 'some',
          other: 'prop',
          _type: 'SOME_TYPE',
        },
      ]);
    });

    it('should not remove if explicity defined', () => {
      const result = cleanInternalPropsFromList(
        [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
        ],
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          autoRemoveTableProperties: false,
        },
      );

      expect(result).toStrictEqual([
        {
          _pk: 'some',
          _sk: 'other',
          _type: 'SOME_TYPE',
          _ts: '123',
          id: '1',
          name: 'some',
          other: 'prop',
        },
      ]);
    });

    it('should use remover cb if present', () => {
      const result = cleanInternalPropsFromList(
        [
          {
            _pk: 'some',
            _sk: 'other',
            _type: 'SOME_TYPE',
            _ts: '123',
            id: '1',
            name: 'some',
            other: 'prop',
          },
        ],
        {
          table: 'db-table',
          partitionKey: '_pk',
          rangeKey: '_sk',
          typeIndex: {
            name: 'TypeIndexName',
            partitionKey: '_type',
            rangeKey: '_ts',
          },
          propertyCleanup: ({ _sk, _ts, ...item }) => item,
        },
      );

      expect(result).toStrictEqual([
        {
          _pk: 'some',
          _type: 'SOME_TYPE',
          id: '1',
          name: 'some',
          other: 'prop',
        },
      ]);
    });
  });
});
