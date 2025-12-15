import { buildUpdateExpression } from './updateExpression';

describe('update expression builder', () => {
  it('should properly build a SET expression from values', () => {
    const expression = buildUpdateExpression({
      values: {
        some: '1',
        prop: '202',
      },
    });

    expect(expression).toBe('SET #some = :some, #prop = :prop');
  });

  it('should properly build an expression exclusively to remove properties', () => {
    const expression = buildUpdateExpression({
      remove: ['some', 'prop'],
    });

    expect(expression).toBe('REMOVE #some, #prop');
  });

  it('should properly build an expression exclusively to remove properties', () => {
    const expression = buildUpdateExpression({
      remove: ['some', 'prop'],
    });

    expect(expression).toBe('REMOVE #some, #prop');
  });

  it('should properly build one ADD expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'add',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('ADD #prop :prop');
  });

  it('should properly build one SUM expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('SET #prop = #prop + :prop');
  });

  it('should properly build one SUBTRACT expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'subtract',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('SET #prop = #prop - :prop');
  });

  it('should properly build one set_if_not_exists expression with same property', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'set_if_not_exists',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('SET #prop = if_not_exists(#prop, :prop)');
  });

  it('should properly build one set_if_not_exists expression with ref property', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'set_if_not_exists',
          value: 1,
          refProperty: 'refProp',
        },
      ],
    });

    expect(expression).toBe('SET #prop = if_not_exists(#refProp, :prop)');
  });

  it('should properly build multiple set_if_not_exists expressions', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'set_if_not_exists',
          value: 1,
          refProperty: 'refProp',
        },
        {
          property: 'other',
          type: 'set_if_not_exists',
          value: 1,
        },
      ],
    });

    expect(expression).toBe(
      'SET #prop = if_not_exists(#refProp, :prop), #other = if_not_exists(#other, :other)',
    );
  });

  it('should properly build one add_to_set expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'add_to_set',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('ADD #prop :prop');
  });

  it('should properly build multiple add_to_set expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'add_to_set',
          value: 1,
        },
        {
          property: 'other',
          type: 'add_to_set',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('ADD #prop :prop, #other :other');
  });

  it('should properly build one remove_from_set expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'remove_from_set',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('DELETE #prop :prop');
  });

  it('should properly build multiple remove_from_set expression', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'remove_from_set',
          value: 1,
        },
        {
          property: 'other',
          type: 'remove_from_set',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('DELETE #prop :prop, #other :other');
  });

  it('should build SUM and SUBTRACTION', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
        },
        {
          property: 'other',
          type: 'subtract',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('SET #prop = #prop + :prop, #other = #other - :other');
  });

  it('should build SUM and ADD', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
        },
        {
          property: 'other',
          type: 'add',
          value: 1,
        },
      ],
    });

    expect(expression).toBe('SET #prop = #prop + :prop ADD #other :other');
  });

  it('should build SUM, ADD, set_if_not_exists, add_to_set', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
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
          value: '1',
        },
        {
          property: 'setAdd',
          type: 'add_to_set',
          value: 1,
        },
      ],
    });

    expect(expression).toBe(
      'SET #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd',
    );
  });

  it('should build SUM, ADD, set_if_not_exists, add_to_set, remove_from_set', () => {
    const expression = buildUpdateExpression({
      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
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
          value: '1',
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

    expect(expression).toBe(
      'SET #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet',
    );
  });

  it('should build SUM, ADD, set_if_not_exists, add_to_set, remove_from_set, remove prop', () => {
    const expression = buildUpdateExpression({
      remove: ['removeProp1', 'removeProp2'],

      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
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
          value: '1',
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

    expect(expression).toBe(
      'SET #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet REMOVE #removeProp1, #removeProp2',
    );
  });

  it('should build SUM, ADD, set_if_not_exists, add_to_set, remove_from_set, remove prop, direct values update', () => {
    const expression = buildUpdateExpression({
      values: {
        name: '1das',
        age: 13,
      },

      remove: ['removeProp1', 'removeProp2'],

      atomicOperations: [
        {
          property: 'prop',
          type: 'sum',
          value: 1,
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
          value: '1',
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

    expect(expression).toBe(
      'SET #name = :name, #age = :age, #prop = #prop + :prop, #set = if_not_exists(#refSet, :set) ADD #other :other, #setAdd :setAdd DELETE #removeSet :removeSet REMOVE #removeProp1, #removeProp2',
    );
  });
});
