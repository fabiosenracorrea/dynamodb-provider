import { getExpressionNames } from '../expressions';
import {
  getProjectExpressionParams,
  getProjectionExpression,
  getProjectionExpressionNames,
} from './helpers';

describe('Projection expression helpers', () => {
  it('getProjectionExpression: should properly build the expression with the prefix', () => {
    expect(getProjectionExpression(['name', 'id', 'hello', 'prop'])).toBe(
      '#__projection_name, #__projection_id, #__projection_hello, #__projection_prop',
    );
  });

  it('getProjectionExpression: should return empty if no arg', () => {
    expect(getProjectionExpression()).toBe(undefined);
  });

  it('getProjectionExpression: should return empty if empty list passed', () => {
    expect(getProjectionExpression([])).toBe(undefined);
  });

  it('getProjectionExpressionNames: should properly create the expression names using *getExpressionNames* and the prefix', () => {
    expect(getProjectionExpressionNames()).toEqual({});
  });

  it('getProjectionExpressionNames: should return empty object if no arg', () => {
    const properties = ['name', 'id', 'hello', 'prop'];

    expect(getProjectionExpressionNames(properties)).toEqual(
      getExpressionNames(properties, '__projection_'),
    );
  });

  it('getProjectionExpressionNames: should return empty object if empty list passed', () => {
    expect(getProjectionExpressionNames([])).toEqual({});
  });

  it('getProjectExpressionParams: properly encapsulates all dynamoBD params from prop list', () => {
    const properties = ['name', 'id', 'hello', 'prop'];

    expect(getProjectExpressionParams(properties)).toStrictEqual({
      ProjectionExpression: getProjectionExpression(properties),

      ExpressionAttributeNames: getProjectionExpressionNames(properties),
    });
  });

  it('getProjectExpressionParams: returns empty object if invalid params', () => {
    expect(getProjectExpressionParams()).toStrictEqual({});
    expect(getProjectExpressionParams([])).toStrictEqual({});
  });
});
