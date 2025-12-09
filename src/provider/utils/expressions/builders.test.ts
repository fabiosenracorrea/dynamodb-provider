/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  toExpressionName,
  toExpressionValue,
  expressionBuilders,
  getExpressionNames,
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  getExpressionValues,
} from './builders';

describe('Provider: expressions - builders tests', () => {
  describe('converters', () => {
    describe('toExpressionName', () => {
      it('should properly prefix expression names with #', () => {
        const prop = 'some_prop';

        expect(toExpressionName(prop)).toBe(`#${prop}`);
      });

      it('should only add the # prefix without changing anything else', () => {
        const prop = `${Math.random()}()()*&(*&(*&))`;

        expect(toExpressionName(prop)).toBe(`#${prop}`);
      });
    });

    describe('toExpressionValue', () => {
      it('toExpressionValue: should properly prefix expression names with :', () => {
        const prop = 'some_prop';

        expect(toExpressionValue(prop)).toBe(`:${prop}`);
      });

      it('toExpressionValue: should only add the : prefix without changing anything else', () => {
        const prop = `${Math.random()}()()*&(*&(*&))`;

        expect(toExpressionValue(prop)).toBe(`:${prop}`);
      });
    });

    describe('expression names', () => {
      it('should be able produce a mapper object with the keys as the values inside the list passed with the # prefix and values as the normal string values', () => {
        const properties = ['name', 'age', 'some_prop', '___hello___'];

        expect(getExpressionNames(properties)).toEqual({
          '#name': 'name',
          '#age': 'age',
          '#some_prop': 'some_prop',
          '#___hello___': '___hello___',
        });
      });

      it('should be able to accept a optional prefix param that is added only to the KEY values', () => {
        const properties = ['name', 'age', 'some_prop', '___hello___'];

        const prefix = 'masked__';

        expect(getExpressionNames(properties, prefix)).toEqual({
          '#masked__name': 'name',
          '#masked__age': 'age',
          '#masked__some_prop': 'some_prop',
          '#masked_____hello___': '___hello___',
        });
      });
    });

    describe('expression attribute name builder', () => {
      it('should be able produce a mapper object with the keys prefixed by "#" and the values be the original key names', () => {
        const item = {
          name: 'random ass value',
          age: 23232,
          some_prop: ['random ass value'],
          ___hello___: { xxx: 'random ass value' },
        };

        expect(buildExpressionAttributeNames(item)).toEqual({
          '#name': 'name',
          '#age': 'age',
          '#some_prop': 'some_prop',
          '#___hello___': '___hello___',
        });
      });
    });

    describe('expression attribute value builder', () => {
      it('should be able produce a mapper object with the keys prefixed by ":" and the values be the original values', () => {
        const item = {
          name: 'random ass value',
          age: 23232,
          some_prop: ['random ass value'],
          ___hello___: { xxx: 'random ass value' },
        };

        expect(buildExpressionAttributeValues(item)).toEqual({
          ':name': 'random ass value',
          ':age': 23232,
          ':some_prop': ['random ass value'],
          ':___hello___': { xxx: 'random ass value' },
        });
      });

      it('should accept an optional prefix param. When received, it adds it as a prefix on each key', () => {
        const item = {
          name: 'random ass value',
          age: 23232,
          some_prop: ['random ass value'],
          ___hello___: { xxx: 'random ass value' },
        };

        const prefix = '__________________hello?';

        expect(buildExpressionAttributeValues(item, prefix)).toEqual({
          [`:${prefix}name`]: 'random ass value',
          [`:${prefix}age`]: 23232,
          [`:${prefix}some_prop`]: ['random ass value'],
          [`:${prefix}___hello___`]: { xxx: 'random ass value' },
        });
      });
    });
  });

  describe('expression builders', () => {
    describe('equal', () => {
      it('should properly create the equal expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.equal({ prop })).toBe(`#${prop} = :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.equal({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} = :MASKED____${prop}`,
        );
      });
    });

    describe('not_equal', () => {
      it('should properly create the not_equal expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_equal({ prop })).toBe(`#${prop} <> :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_equal({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} <> :MASKED____${prop}`,
        );
      });
    });

    describe('lower_than', () => {
      it('should properly create the lower_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_than({ prop })).toBe(`#${prop} < :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_than({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} < :MASKED____${prop}`,
        );
      });
    });

    describe('lower_or_equal_than', () => {
      it('should properly create the lower_or_equal_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_or_equal_than({ prop })).toBe(`#${prop} <= :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_or_equal_than({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} <= :MASKED____${prop}`,
        );
      });
    });

    describe('bigger_than', () => {
      it('should properly create the bigger_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_than({ prop })).toBe(`#${prop} > :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_than({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} > :MASKED____${prop}`,
        );
      });
    });

    describe('bigger_or_equal_than', () => {
      it('should properly create the bigger_or_equal_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_or_equal_than({ prop })).toBe(`#${prop} >= :${prop}`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_or_equal_than({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} >= :MASKED____${prop}`,
        );
      });
    });

    describe('begins_with', () => {
      it('should properly create the begins_with expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.begins_with({ prop })).toBe(`begins_with(#${prop}, :${prop})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.begins_with({ prop, prefix: 'MASKED____' })).toBe(
          `begins_with(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });
    });

    describe('contains', () => {
      it('should properly create the contains expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.contains({ prop })).toBe(`contains(#${prop}, :${prop})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.contains({ prop, prefix: 'MASKED____' })).toBe(
          `contains(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });
    });

    describe('not_contains', () => {
      it('should properly create the not_contains expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_contains({ prop })).toBe(`not contains(#${prop}, :${prop})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_contains({ prop, prefix: 'MASKED____' })).toBe(
          `not contains(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });
    });

    describe('exists', () => {
      it('should properly create the exists expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.exists({ prop })).toBe(`attribute_exists(#${prop})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.exists({ prop, prefix: 'MASKED____' })).toBe(
          `attribute_exists(#MASKED____${prop})`,
        );
      });
    });

    describe('not_exists', () => {
      it('should properly create the not_exists expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_exists({ prop })).toBe(`attribute_not_exists(#${prop})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_exists({ prop, prefix: 'MASKED____' })).toBe(
          `attribute_not_exists(#MASKED____${prop})`,
        );
      });
    });

    describe('in', () => {
      it('should properly create the in expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';
        const value = [1, 2, 3, 4];

        const toName = (p: string, index: number) => `:${p}_${index}`;
        const valueString = value.map((_, index) => toName(prop, index)).join(',');

        expect(expressionBuilders.in({ prop, value })).toBe(`#${prop} in (${valueString})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';
        const value = [1, 2, 3, 4];

        const toName = (p: string, index: number) => `:MASKED____${p}_${index}`;
        const valueString = value.map((_, index) => toName(prop, index)).join(',');

        expect(expressionBuilders.in({ prop, value, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} in (${valueString})`,
        );
      });
    });

    describe('not_in', () => {
      it('should properly create the not_in expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';
        const value = [1, 2, 3, 4];

        const toName = (p: string, index: number) => `:${p}_${index}`;
        const valueString = value.map((_, index) => toName(prop, index)).join(',');

        expect(expressionBuilders.not_in({ prop, value })).toBe(`not #${prop} in (${valueString})`);
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';
        const value = [1, 2, 3, 4];

        const toName = (p: string, index: number) => `:MASKED____${p}_${index}`;
        const valueString = value.map((_, index) => toName(prop, index)).join(',');

        expect(expressionBuilders.not_in({ prop, value, prefix: 'MASKED____' })).toBe(
          `not #MASKED____${prop} in (${valueString})`,
        );
      });
    });

    describe('between', () => {
      it('should properly create the between expression, prefixed correctly on prop/value + suffixed with start/end', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.between({ prop })).toBe(
          `#${prop} between :${prop}_start and :${prop}_end`,
        );
      });

      it('should be able to receive an optional prefix param that will be added properly before the prop value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.between({ prop, prefix: 'MASKED____' })).toBe(
          `#MASKED____${prop} between :MASKED____${prop}_start and :MASKED____${prop}_end`,
        );
      });
    });
  });

  describe('expression attribute values builder', () => {
    it('should be able to properly prefix common operations', () => {
      const values = getExpressionValues([
        {
          operation: 'equal',
          property: 'some_prop',
          value: 'some_value',
        },
        {
          operation: 'in',
          property: 'other_prop',
          values: [1],
        },
        {
          operation: 'not_in',
          property: 'no_in_prop',
          values: [3, 4, 5, 6],
        },
        {
          operation: 'exists',
          property: 'hello',
        },
        {
          operation: 'not_exists',
          property: 'hello',
        },
        {
          operation: 'not_equal',
          property: 'no_equal_prop',
          value: '102901920192',
        },
        {
          end: 1,
          start: 0,
          operation: 'between',
          property: 'between_prop',
        },
      ]);

      expect(values).toEqual({
        ':some_prop': 'some_value',
        ':no_equal_prop': '102901920192',
        ':between_prop_start': 0,
        ':between_prop_end': 1,
        ':other_prop_0': 1,
        ':no_in_prop_0': 3,
        ':no_in_prop_1': 4,
        ':no_in_prop_2': 5,
        ':no_in_prop_3': 6,
      });
    });
  });
});
