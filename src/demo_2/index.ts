import { Race, Reset, Board, Colors } from '../el'

// interface Listener { <Observer>(arg: Observer): void }


class Observer {
  readonly timestamp: number
  readonly color: string
  subject: Subject
  listener: number = 0
  callback: Function

  constructor(callback: Function, instance: Subject) {
    this.timestamp = Date.now()
    this.subject = instance
    this.color = Colors[instance.observers.length % 10]
    this.callback = callback
    this.creator()
  }

  public creator(): void {
    Board.console(`${this.timestamp} 收到起跑指令，开始出击！</span>`, this.color)
    this.listener = window.setTimeout((t: string) => {
      Board.console(t, this.color)
      this.subject.target = this.timestamp
    }, 10000 * Math.random(), `----- ${this.timestamp} 抵达终点！ ----`)
  }

  public abort(): void {
    if (this.listener) {
      window.clearTimeout(this.listener)
      Board.console(`${this.timestamp} 被中途淘汰！`, this.color)
    }
  }

  public succ(): void {
    Board.console(`***** ${this.timestamp} 获得奖牌！ *****`, this.color)
    this.callback(this)
  }

}


class ObserverList {
  private poll: Array<Observer> = []

  add(observer: Observer): void { this.poll.push(observer) }

  remove(observer: Observer): void {
    this.poll = this.poll.filter(ob => ob !== observer)
  }

  select(index: number): Observer { return this.poll[index] }

  clean() {
    while (this.poll.length > 0) {
      const p: Observer = <Observer>this.poll.shift()
      if (p.listener) { p.abort() }
    }
  }

  get length() { return this.poll.length }
}

class Subject {
  private _target: number = 0
  public observers: ObserverList

  constructor() {
    this.observers = new ObserverList()
  }

  get target(): number { return this._target }
  set target(val: number) {
    const old = this._target
    this._target = val
    if (old === val || val === 0) return
    this.notify(val)
  }

  add(callback: Function) {
    const ob = new Observer(callback, this)
    this.observers.add(ob)
  }

  remove(observer: Observer) { this.observers.remove(observer) }

  notify(val: number) {
    let i = 0
    while (i < this.observers.length) {
      const p: Observer = this.observers.select(i)
      if (p.listener) {
        if (p.timestamp < val) {
          p.abort()
          this.observers.remove(p)
        } else if (p.timestamp === val) {
          p.succ()
          this.observers.remove(p)
        } else {
          i++
        }
      }
    }
  }

  reset() {
    this.observers.clean()
    this.target = 0
    Board.el.innerHTML = ''
  }


}

export default function () {
  const subject = new Subject()
  Race.addEventListener('click', _ => subject.add((ob: Observer) => Board.console('获奖者当然要接受赛后采访啦！', ob.color)))
  Reset.addEventListener('click', _ => subject.reset())
}

