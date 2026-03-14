import { activeSub } from './effect'
import { type Dep, type Link, link, propagate } from './system'

enum ReactiveFlags {
  IS_REF = '__v_isRef',
}

class RefImpl<T> implements Dep {
  _value: T;

  [ReactiveFlags.IS_REF] = true

  // 订阅者链表头节点
  subs: Link | undefined
  // 订阅者链表 尾节点
  subsTail: Link | undefined

  constructor(value: T) {
    this._value = value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value: unknown) {
  return new RefImpl(value)
}

export function isRef(value: any) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

export function trackRef(dep: RefImpl<any>) {
  if (!activeSub) return
  link(dep, activeSub)
}

export function triggerRef(dep: RefImpl<any>) {
  if (!dep.subs) return
  propagate(dep.subs)
}
