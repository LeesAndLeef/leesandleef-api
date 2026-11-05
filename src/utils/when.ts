export const when = <T, R>(value: T | undefined, build: (value: T) => R): R | undefined =>
  value === undefined ? undefined : build(value)
