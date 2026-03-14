/**
 * 订阅者（effect）
 */
export interface Sub {
  // 依赖项链表头节点
  deps: Link | undefined
  // 依赖项链表尾节点
  depsTail: Link | undefined
  notify(): void
}

/**
 * 依赖项（响应式数据）
 */
export interface Dep {
  // 订阅者链表头节点
  subs: Link | undefined
  // 订阅者链表尾节点
  subsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Sub
  // 下一个订阅者节点
  nextSub: Link | undefined
  // 上一个订阅者节点
  prevSub: Link | undefined
  // 依赖项
  dep: Dep
  // 下一个依赖项节点
  nextDep: Link | undefined
}

/**
 * 在响应式数据和 effect 之间建立联系
 */
export function link(dep: Dep, sub: Sub) {
  // 复用依赖项，防止重复收集依赖
  const currentDep = sub.depsTail
  /**
   * 分两种情况：
   * 1. 如果头节点有，尾节点没有，那么尝试着复用头节点
   * 2. 如果尾节点还有 nextDep，尝试复用尾节点的 nextDep
   */
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  const link: Link = {
    sub,
    dep,
    nextSub: undefined,
    prevSub: undefined,
    nextDep: undefined,
  }

  // 将链表和响应式数据建立联系
  if (dep.subsTail) {
    dep.subsTail.nextSub = link
    link.prevSub = dep.subsTail
    dep.subsTail = link
  } else {
    dep.subs = dep.subsTail = link
  }

  // 将链表和 effect 建立联系
  if (sub.depsTail) {
    sub.depsTail.nextDep = link
    sub.depsTail = link
  } else {
    sub.deps = sub.depsTail = link
  }
}

export function propagate(subs: Link) {
  let link: Link | undefined = subs
  const queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect.notify())
}
