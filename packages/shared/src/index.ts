export function isObject(val: unknown) {
  return val !== null && typeof val === 'object'
}

export function hasChanged(newVal: unknown, oldVal: unknown) {
  return !Object.is(newVal, oldVal)
}
