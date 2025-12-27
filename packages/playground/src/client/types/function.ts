/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Generic function to be able to be referenced/extended
 */
export type AnyFunction = (...p: any[]) => any;

/**
 * Easily obtain the first parameter of a function
 */
export type FirstParameter<Fn extends AnyFunction> = Parameters<Fn>[0];
