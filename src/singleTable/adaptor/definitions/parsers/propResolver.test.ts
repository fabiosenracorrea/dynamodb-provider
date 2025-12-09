import { cleanInternalProps } from './propRemoval';
import { resolveProps, resolvePropsFromList } from './propResolver';

describe('single table adaptor - prop cleaner helpers', () => {
  describe('resolveProps', () => {
    it('should simply remove internal props if no parser', () => {
      const target = {
        _pk: 'some',
        _sk: 'other',
        _type: 'SOME_TYPE',
        _ts: '123',
        id: '1',
        name: 'some',
        other: 'prop',
      };

      const config = {
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
      };

      const result = resolveProps(target, config);

      expect(result).toStrictEqual(cleanInternalProps(target, config));
    });

    it('should pass internal cleanup result to the parser, returning its result', () => {
      const parseResult = Symbol('return..');

      const parser = jest.fn().mockReturnValue(parseResult);

      const target = {
        _pk: 'some',
        _sk: 'other',
        _type: 'SOME_TYPE',
        _ts: '123',
        id: '1',
        name: 'some',
        other: 'prop',
      };

      const config = {
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
      };

      const result = resolveProps(target, config, parser);

      expect(parser).toHaveBeenCalled();

      expect(parser).toHaveBeenCalledWith(cleanInternalProps(target, config));

      expect(result).toStrictEqual(parseResult);
    });
  });

  describe('resolvePropsFromList', () => {
    it('should remove just internal props if no parser', () => {
      const target = {
        _pk: 'some',
        _sk: 'other',
        _type: 'SOME_TYPE',
        _ts: '123',
        id: '1',
        name: 'some',
        other: 'prop',
      };

      const config = {
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
      };

      const result = resolvePropsFromList([target], config);
      const expected = [cleanInternalProps(target, config)];

      expect(result).toStrictEqual(expected);
    });

    it('should apply parser to every item in the list', () => {
      const parseResult = Symbol('return..');

      const parser = jest.fn().mockReturnValue(parseResult);

      const target = {
        _pk: 'some',
        _sk: 'other',
        _type: 'SOME_TYPE',
        _ts: '123',
        id: '1',
        name: 'some',
        other: 'prop',
      };

      const config = {
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
      };

      const result = resolvePropsFromList([target, target, target], config, parser);

      expect(parser).toHaveBeenCalledTimes(3);

      expect(parser).toHaveBeenCalledWith(cleanInternalProps(target, config));

      expect(result).toStrictEqual([parseResult, parseResult, parseResult]);
    });
  });
});
