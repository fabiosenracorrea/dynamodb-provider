// https://stackoverflow.com/questions/69793164/typescript-weird-type-intersection-of-string
/**
 * A type to make it possible to autocomplete on fields that accept strongly typed strings + any string
 *
 * `T = 'red' | 'blue' | SafeToIntersectString` => autocompletes works + string is also acceptable
 *
 * Sometimes you need this imported to VS CODE to properly work, but generally use the OrString
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type SafeToIntersectString = string & {};

/**
 * Safely create a type that can accept pre-determined strings or any, with autocomplete
 *
 * `OrString<'red' | 'blue'>` => autocompletes works + string is also acceptable
 */
export type OrString<T extends string> = T | SafeToIntersectString;
