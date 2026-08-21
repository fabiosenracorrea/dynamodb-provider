import type { KeyPiece } from './api';

/**
 * A partition key rendered as a comparable shape: constants kept, variables collapsed
 * to `{value}`. Two entities sharing this string share a partition.
 *
 * The separator must come from the table config — hardcoding `#` silently produced
 * wrong patterns (and broken partition lookups) for any table using another one.
 */
export function buildKeyPattern(pieces: KeyPiece[], separator: string): string {
  return pieces
    .map((piece) => (piece.type === 'CONSTANT' ? piece.value : '{value}'))
    .join(separator);
}

/**
 * Identity for a partition group. `source` cannot contain the delimiter (it is an
 * index name or the literal TABLE), so a first-delimiter split is unambiguous even
 * when the pattern itself contains one.
 */
export function partitionGroupId(source: string, pattern: string): string {
  return `${source}|${pattern}`;
}
