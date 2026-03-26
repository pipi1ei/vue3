import { hasChanged, isObject } from '@vue/shared'
import { track, trigger } from './dep'

export function reactive(target: any) {
  return createReactiveObject(target)
}

const reactiveMap = new WeakMap()
const reactiveSet = new Set()

export function createReactiveObject(target: any) {
  if (!isObject(target)) {
    return target
  }

  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  if (isReactive(target)) {
    return target
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      track(target, key)
      if (isObject(res)) {
        return reactive(res)
      }
      return res
    },
    set(target, key, value, receiver) {
      const oldValue = target[key as keyof typeof target]
      const res = Reflect.set(target, key, value, receiver)
      if (hasChanged(oldValue, value)) {
        trigger(target, key)
      }
      return res
    },
  })

  reactiveMap.set(target, proxy)
  reactiveSet.add(proxy)
  return proxy
}

export function isReactive(value: any) {
  return reactiveSet.has(value)
}
