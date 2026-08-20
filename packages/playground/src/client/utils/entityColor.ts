/**
 * Every entity type gets a stable hue, derived from its name. Saturation and
 * lightness come from theme tokens, so the same entity reads consistently in both
 * themes — this is what makes a mixed-type partition result scannable.
 *
 * Hues are spread on a 137.5° golden-angle step so neighbouring types stay distinct
 * instead of clustering the way a raw hash does.
 */
const GOLDEN_ANGLE = 137.508;

function hashOf(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

export function entityHue(type: string): number {
  return Math.round((hashOf(type) * GOLDEN_ANGLE) % 360);
}

export function entityColor(type: string): string {
  return `hsl(${entityHue(type)} var(--entity-saturation) var(--entity-lightness))`;
}

/** Faint background wash for rows/badges of this entity. */
export function entityTint(type: string, alpha = 0.14): string {
  return `hsl(${entityHue(
    type,
  )} var(--entity-saturation) var(--entity-lightness) / ${alpha})`;
}
