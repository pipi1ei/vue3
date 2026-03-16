/**
 * 订阅者（effect）
 */
export interface Sub {
  // 依赖项链表头节点
  deps?: Link
  // 依赖项链表尾节点
  depsTail?: Link
  tracking: boolean
  notify(): void
}

/**
 * 依赖项（响应式数据）
 */
export interface Dep {
  // 订阅者链表头节点
  subs?: Link
  // 订阅者链表尾节点
  subsTail?: Link
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Sub | undefined
  // 下一个订阅者节点
  nextSub?: Link
  // 上一个订阅者节点
  prevSub?: Link
  // 依赖项
  dep: Dep | undefined
  // 下一个依赖项节点
  nextDep?: Link
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
    nextDep,
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
    const { sub } = link
    if (!sub!.tracking) {
      queuedEffect.push(link.sub)
    }
    link = link.nextSub
  }

  queuedEffect.forEach(sub => sub!.notify())
}

export function startTrack(sub: Sub) {
  sub.depsTail = undefined
}

export function endTrack(sub: Sub) {
  // 如果 depsTail 还有 nextDep，说明后面的依赖需要清理
  if (sub.depsTail?.nextDep) {
    if (sub.depsTail.nextDep) {
      clearTracking(sub.depsTail.nextDep)
      sub.depsTail.nextDep = undefined
    }
  }
  // 如果 depsTail 为空但 deps 存在，需要从头节点开始清理
  else if (!sub.depsTail && sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

function clearTracking(link: Link | undefined) {
  while (link) {
    const { nextSub, prevSub, dep, nextDep } = link

    /**
     * 如果 prevSub 有，就把 prevSub 的下一个节点指向当前节点的下一个
     * 如果没有，就是头节点，把 dep 头节点指向当前节点的下一个
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep!.subs = nextSub
    }

    /**
     * 如果有 nextDep，就把 nextDep 的上一个节点指向当前节点的上一个
     * 如果没有，就是尾节点，把 dep 尾节点指向当前节点的上一个
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep!.subsTail = prevSub
    }

    link.sub = link.dep = undefined
    link.nextDep = undefined
    link = nextDep
  }
}
