import { getPropertyCounter } from './counter';

describe('property counter', () => {
  it('should suffix repeated property references with their count', () => {
    const counter = getPropertyCounter();

    expect([
      counter.withCountedSuffix('property'),
      counter.withCountedSuffix('property'),
      counter.withCountedSuffix('property'),
    ]).toEqual(['property', 'property__1', 'property__2']);
  });

  it('should count each property independently', () => {
    const counter = getPropertyCounter();

    expect([
      counter.withCountedSuffix('first'),
      counter.withCountedSuffix('second'),
      counter.withCountedSuffix('first'),
      counter.withCountedSuffix('second'),
    ]).toEqual(['first', 'second', 'first__1', 'second__1']);
  });
});
