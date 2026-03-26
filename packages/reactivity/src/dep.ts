import { activeSub } from './effect'
import { type Link, type Dependency, link, propagate } from './system'

type KeyToDepMap = Map<any, Dep>

export class Dep implements Dependency {
  _subs?: Link | undefined
  subsTail?: Link | undefined

  constructor(
    private map: KeyToDepMap,
    private key: unknown,
  ) {}

  get subs() {
    return this._subs
  }

  set subs(value: Link | undefined) {
    this._subs = value
    if (value === undefined) {
      this.map.delete(this.key)
    }
  }
}

export const targetMap = new WeakMap<object, KeyToDepMap>()

export function track(target: object, key: unknown) {
  if (!activeSub) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Dep(depsMap, key)))
  }
  link(dep, activeSub)
}

export function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep?.subs) {
    propagate(dep.subs)
  }
}
