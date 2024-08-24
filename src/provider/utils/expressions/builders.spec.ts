/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  toExpressionName,
  toExpressionValue,
  expressionBuilders,
  getExpressionNames,
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
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

      it('should be able to accept a masker function that only masks the KEY values', () => {
        const properties = ['name', 'age', 'some_prop', '___hello___'];
        const masker = (v: string) => `masked__${v}`;

        expect(getExpressionNames(properties, { maskName: masker })).toEqual({
          '#masked__name': 'name',
          '#masked__age': 'age',
          '#masked__some_prop': 'some_prop',
          '#masked_____hello___': '___hello___',
        });
      });

      it('should be able to use only the value from the masker function return', () => {
        const properties = ['name', 'age', 'some_prop', '___hello___'];
        const masker = () => `masked__`;

        expect(getExpressionNames(properties, { maskName: masker })).toEqual({
          '#masked__': '___hello___',
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
    });
  });

  describe('expression builders', () => {
    describe('equal', () => {
      it('should properly create the equal expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.equal(prop)).toBe(`#${prop} = :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.equal(prop, masker)).toBe(
          `#MASKED____${prop} = :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.equal(prop, masker)).toBe(`#___NEW_VALUE___ = :___NEW_VALUE___`);
      });
    });

    describe('not_equal', () => {
      it('should properly create the not_equal expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_equal(prop)).toBe(`#${prop} <> :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.not_equal(prop, masker)).toBe(
          `#MASKED____${prop} <> :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.not_equal(prop, masker)).toBe(
          `#___NEW_VALUE___ <> :___NEW_VALUE___`,
        );
      });
    });

    describe('lower_than', () => {
      it('should properly create the lower_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_than(prop)).toBe(`#${prop} < :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.lower_than(prop, masker)).toBe(
          `#MASKED____${prop} < :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.lower_than(prop, masker)).toBe(
          `#___NEW_VALUE___ < :___NEW_VALUE___`,
        );
      });
    });

    describe('lower_or_equal_than', () => {
      it('should properly create the lower_or_equal_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.lower_or_equal_than(prop)).toBe(`#${prop} <= :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.lower_or_equal_than(prop, masker)).toBe(
          `#MASKED____${prop} <= :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.lower_or_equal_than(prop, masker)).toBe(
          `#___NEW_VALUE___ <= :___NEW_VALUE___`,
        );
      });
    });

    describe('bigger_than', () => {
      it('should properly create the bigger_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_than(prop)).toBe(`#${prop} > :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.bigger_than(prop, masker)).toBe(
          `#MASKED____${prop} > :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.bigger_than(prop, masker)).toBe(
          `#___NEW_VALUE___ > :___NEW_VALUE___`,
        );
      });
    });

    describe('bigger_or_equal_than', () => {
      it('should properly create the bigger_or_equal_than expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.bigger_or_equal_than(prop)).toBe(`#${prop} >= :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.bigger_or_equal_than(prop, masker)).toBe(
          `#MASKED____${prop} >= :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.bigger_or_equal_than(prop, masker)).toBe(
          `#___NEW_VALUE___ >= :___NEW_VALUE___`,
        );
      });
    });

    describe('begins_with', () => {
      it('should properly create the begins_with expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.begins_with(prop)).toBe(`begins_with(#${prop}, :${prop})`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.begins_with(prop, masker)).toBe(
          `begins_with(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.begins_with(prop, masker)).toBe(
          `begins_with(#___NEW_VALUE___, :___NEW_VALUE___)`,
        );
      });
    });

    describe('contains', () => {
      it('should properly create the contains expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.contains(prop)).toBe(`contains(#${prop}, :${prop})`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.contains(prop, masker)).toBe(
          `contains(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.contains(prop, masker)).toBe(
          `contains(#___NEW_VALUE___, :___NEW_VALUE___)`,
        );
      });
    });

    describe('not_contains', () => {
      it('should properly create the not_contains expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_contains(prop)).toBe(`not contains(#${prop}, :${prop})`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.not_contains(prop, masker)).toBe(
          `not contains(#MASKED____${prop}, :MASKED____${prop})`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.not_contains(prop, masker)).toBe(
          `not contains(#___NEW_VALUE___, :___NEW_VALUE___)`,
        );
      });
    });

    describe('exists', () => {
      it('should properly create the exists expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.exists(prop)).toBe(`attribute_exists(#${prop})`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.exists(prop, masker)).toBe(
          `attribute_exists(#MASKED____${prop})`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.exists(prop, masker)).toBe(`attribute_exists(#___NEW_VALUE___)`);
      });
    });

    describe('not_exists', () => {
      it('should properly create the not_exists expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.not_exists(prop)).toBe(`attribute_not_exists(#${prop})`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.not_exists(prop, masker)).toBe(
          `attribute_not_exists(#MASKED____${prop})`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.not_exists(prop, masker)).toBe(
          `attribute_not_exists(#___NEW_VALUE___)`,
        );
      });
    });

    describe('in', () => {
      it('should properly create the in expression, prefixed correctly on prop/value', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.in(prop)).toBe(`#${prop} in :${prop}`);
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.in(prop, masker)).toBe(
          `#MASKED____${prop} in :MASKED____${prop}`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.in(prop, masker)).toBe(`#___NEW_VALUE___ in :___NEW_VALUE___`);
      });
    });

    describe('between', () => {
      it('should properly create the between expression, prefixed correctly on prop/value + suffixed with low/high', () => {
        const prop = 'some_prop';

        expect(expressionBuilders.between(prop)).toBe(
          `#${prop} between :${prop}_low and :${prop}_high`,
        );
      });

      it('should be able to receive a masker function that returns the actual reference property value to be used in the expression', () => {
        const prop = 'some_prop';
        const masker = (v: string) => `MASKED____${v}`;

        expect(expressionBuilders.between(prop, masker)).toBe(
          `#MASKED____${prop} between :MASKED____${prop}_low and :MASKED____${prop}_high`,
        );
      });

      it('only the masker function return should be considered', () => {
        const prop = 'some_prop';
        const masker = () => `___NEW_VALUE___`;

        expect(expressionBuilders.between(prop, masker)).toBe(
          `#___NEW_VALUE___ between :___NEW_VALUE____low and :___NEW_VALUE____high`,
        );
      });

      it('it should always have the low/high suffix, even if masker has logic to prevent it', () => {
        const prop = 'some_prop';
        const masker = (v: string) => v.replace(/_low$/, '').replace(/_high$/, '');

        expect(expressionBuilders.between(prop, masker)).toBe(
          `#some_prop between :some_prop_low and :some_prop_high`,
        );
      });
    });
  });
});
