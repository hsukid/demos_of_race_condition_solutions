import { Race, Reset, Board, Colors } from '../el'

const enum CustomEventType {
  RaceReached,
  RaceReset
}

class EventCenter {
  private subscribers: Map<CustomEventType, (Function | Observer)[]> = new Map()

  subscribe(type: CustomEventType, fn: Function | Observer) {
    let listener: Function | Observer
    if (type === CustomEventType.RaceReached) {
      listener = new Observer(<Function>fn, this)
    } else {
      listener = fn
    }

    if (this.subscribers.has(type)) {
      this.subscribers.get(type)?.push(listener)
    } else {
      this.subscribers.set(type, [listener])
    }
  }

  unsubscribe(type: CustomEventType, observer: Observer) {
    let listeners = this.subscribers.get(type)
    if (!listeners || !listeners.length) return
    this.subscribers.set(type, listeners.filter(v => v !== observer))
  }

  publish(type: CustomEventType, data: any) {
    let listeners = this.subscribers.get(type)
    if (!listeners || !listeners.length) return
    if (type === CustomEventType.RaceReached) {
      listeners.forEach(observer => (observer as Observer).listener(data))
    } else {
      listeners.forEach(observer => (observer as Function)(data))
    }
  }

}
// TODO 丰富赛道和奖台
class View {
  static board = Board
  console(content: string, color: string) {
    View.board.console(content, color)
  }
  reset() { Board.el.innerHTML = '' }
}


class Observer {
  readonly timestamp: number
  readonly evtcenter: EventCenter
  readonly color: string
  timer: number = 0
  callback: Function

  constructor(callback: Function, evtcenter: EventCenter) {
    this.timestamp = Date.now()
    this.evtcenter = evtcenter
    const randomIndex = (Math.ceil(Math.random() * 10)) % 10
    this.color = Colors[randomIndex]
    this.callback = callback
    this.creator() 
  }

  public creator(): void {
    Board.console(`${this.timestamp} 收到起跑指令，开始出击！</span>`, this.color)
    this.timer = window.setTimeout((t: string) => {
      Board.console(t, this.color)
      this.evtcenter.publish(CustomEventType.RaceReached, this.timestamp)
    }, 10000 * Math.random(), `----- ${this.timestamp} 抵达终点！ ----`)
  }

  public abort(): void {
    if (this.timer) {
      window.clearTimeout(this.timer)
      Board.console(`${this.timestamp} 被中途淘汰！`, this.color)
    }
  }

  public succ(): void {
    Board.console(`***** ${this.timestamp} 获得奖牌！ *****`, this.color)
    this.callback(this)
  }

  public listener(timestamp: number): void {
    if (timestamp === this.timestamp) { this.succ() }
    if (timestamp === 0 || timestamp > this.timestamp) { this.abort() }
    if (timestamp < this.timestamp) return

    this.evtcenter.unsubscribe(CustomEventType.RaceReached, this)
  }
}

class Subject {
  private _target: number = 0
  private evtcenter: EventCenter

  constructor(evtcenter: EventCenter) { this.evtcenter = evtcenter }

  get target(): number { return this._target }
  set target(val: number) {
    const old = this._target
    this._target = val
    if (old === val) return
    this.evtcenter.publish(CustomEventType.RaceReached, val)
  }
}

export default function () {
  const evtcenter = new EventCenter()
  const view = new View()
  const subject = new Subject(evtcenter)
  evtcenter.subscribe(CustomEventType.RaceReset, () => {
    subject.target = 0
    view.reset()
  })
  Race.addEventListener('click', _ => evtcenter.subscribe(CustomEventType.RaceReached, (ob: Observer) => Board.console('获奖者当然要接受赛后采访啦！', ob.color)))
  Reset.addEventListener('click', _ => evtcenter.publish(CustomEventType.RaceReset, null))
}

