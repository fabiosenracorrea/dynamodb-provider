/* eslint-disable @typescript-eslint/no-explicit-any */

// https://stackoverflow.com/questions/63542526/merge-discriminated-union-of-object-types-in-typescript
type UnionToIntersectionBase<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

// makes the result be shown in a better way
export type UnionToIntersection<U> = UnionToIntersectionBase<U> extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

/**
 *    Resolves TS type result so VSCODE shows it as string | number[]
 *     instead of ComplexExtract<SomeType> that would result into string | number[]
 *
 *     check out our "cascadeEval" definition with this test params to see it in action:
 *
 *             | hover over here
 *             v
 *     const xxxxxxx = cascadeEval([
 *       { is: 'hhe', then: 2 },
 *       { is: 'hhe', then: 'hello' },
 *       { is: 'hhe', then: null },
 *       { is: 'hhe', then: () => [2] },
 *       { is: true, then: { ok: true } },
 *     ]);
 *
 *   Add and remove "ExpandType" to see how it works
 *
 *   IMPORTANT => If this type is not on the file using it, VSCODE does not resolve it properly...
 *
 *   REF: https://stackoverflow.com/questions/50813518/is-there-any-way-to-print-a-resolved-typescript-type?rq=4
 *
 */
export type ExpandType<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
