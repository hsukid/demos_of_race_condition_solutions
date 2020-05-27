import { Race, Reset, Board, Colors } from '../el'

// interface Listener { <Observer>(arg: Observer): void }


class Observer {
  readonly timestamp: number
  readonly color: string
  ep: EventPoll
  listener: number = 0
  callback: Function

  constructor(callback: Function, instance: EventPoll) {
    this.timestamp = Date.now()
    this.ep = instance
    this.color = Colors[this.ep.poll.length % 10]
    this.callback = callback
    this.creator()
  }

  public creator(): void {
    Board.console(`${this.timestamp} 收到起跑指令，开始出击！</span>`, this.color)
    this.listener = window.setTimeout((t: string) => {
      Board.console(t, this.color)
      this.ep.target = this.timestamp
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
    this.callback()
  }

}



class EventPoll {
  private _target: number = 0
  poll: Array<Observer> = []

  get target(): number { return this._target }
  set target(val: number) {
    const old = this._target
    this._target = val
    if (old === val || val === 0) return
    let i = 0
    while (i < this.poll.length) {
      const p: Observer = this.poll[i]
      if (p.listener) {
        if (p.timestamp < val) {
          p.abort()
          this.poll.splice(i, 1)
        } else if (p.timestamp === val) {
          p.succ()
          this.poll.splice(i, 1)
        } else {
          i++
        }
      }
    }
  }

  subscribe(cb: Function) {
    const observer = new Observer(cb, this)
    this.poll.push(observer)
  }

  reset() {
    while (this.poll.length > 0) {
      const p: Observer = <Observer>this.poll.shift()
      if (p.listener) { p.abort() }
    }
    this.target = 0
    Board.el.innerHTML = ''
  }

}

export default function () {
  const epoll = new EventPoll()
  Race.addEventListener('click', _ => epoll.subscribe(() => console.log('获奖者当然要接受赛后采访啦！')))
  Reset.addEventListener('click', _ => epoll.reset())
}

