export const countsFor = <K extends string>(keys: readonly K[], counts: ReadonlyMap<string, number>) =>
  Object.fromEntries(keys.map((key) => [key, counts.get(key) ?? 0])) as Record<K, number>
