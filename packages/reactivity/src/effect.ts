import { Link, type Sub } from './system'

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export let activeSub: ReactiveEffect

export class ReactiveEffect<T = any> implements Sub {
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined

  constructor(public fn: () => T) {}

  run() {
    const prevSub = activeSub
    activeSub = this
    // 执行 fn 之前先把 depsTail 置空，尝试在收集依赖时复用依赖项
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      activeSub = prevSub
    }
  }

  scheduler() {
    this.run()
  }

  notify() {
    this.scheduler()
  }
}

export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = {},
) {
  const _effect = new ReactiveEffect(fn)
  Object.assign(_effect, options)

  if (!options.lazy) {
    _effect.run()
  }

  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect

  return runner
}
