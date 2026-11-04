type NullableKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T]

export type Compact<T> = Omit<T, NullableKeys<T>> & { [K in NullableKeys<T>]?: Exclude<T[K], null> }

export function compact<T extends object>(row: T): Compact<T> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)) as Compact<T>
}
