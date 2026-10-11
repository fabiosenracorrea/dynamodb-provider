/**
 * Creates a scoped counter for nested properties in order to allow
 * we reference the same properties multiple times.
 *
 * Eg if we want prop < 10 OR prop > 20
 *
 * Previously this would fail and assign the last seen value
 * to the property reference in the expression params
 */
export function getPropertyCounter() {
  const counts = {} as Record<string, number>;

  return {
    counts,

    withCountedSuffix: (property: string, countRef = property) => {
      const count = counts[countRef] ?? 0;

      counts[countRef] = count + 1;

      if (!count) return property;

      return `${property}_${count}`;
    },
  };
}

export type PropertyCounter = ReturnType<typeof getPropertyCounter>;
