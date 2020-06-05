import { Race, Reset, Creator, Board, Colors } from '../el'

const enum CustomEventType {
  RaceReached,
  RaceReset,
  CreateTrack,
  Console,
  Update
}

class Track {
  el: HTMLElement
  constructor() {
    const el = document.createElement('div')
    el.className = 'track'
    this.el = el
  }

  console(text: string, color: string) {
    const o = this.el.innerHTML
    const n = `
      ${o}
      <br>
      <span style="color: ${color}">${text}</span>
    `
    this.el.innerHTML = n
  }
}

class EventCenter {
  private subscribers: Map<CustomEventType, (Function | Observer)[]> = new Map()

  subscribe(type: CustomEventType, listener: Function | Observer) {
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

  publish(type: CustomEventType, arg1: any, ...args: any[]) {
    let listeners = this.subscribers.get(type)
    if (!listeners || !listeners.length) return
    if (type === CustomEventType.RaceReached) {
      listeners.forEach(observer => (observer as Observer).listener(arg1))
    } else {
      listeners.forEach(observer => (observer as Function)(arg1, ...args))
    }
  }

}
// TODO 丰富赛道和奖台
class View {
  static board = Board
  public tracks: Track[] = []
  console(content: string, color: string, index: number) {
    const track = this.tracks[index]
    track.console(content, color)
  }
  reset() {
    View.board.el.innerHTML = ''
    this.tracks = []
  }
  add() {
    const track = new Track()
    View.board.el.appendChild(track.el)
    this.tracks.push(track)
    track.console('- - - - - 赛道准备完毕! - - - - -', '#000')
  }
  getTrack(): number {
    const num = Math.floor(Math.random() * this.tracks.length)
    return num
  }
}


class Observer {
  readonly timestamp: number
  readonly evtcenter: EventCenter
  readonly color: string
  readonly trackId: number
  timer: number = 0
  callback: Function

  constructor(callback: Function, evtcenter: EventCenter, trackId: number) {
    this.timestamp = Date.now()
    this.evtcenter = evtcenter
    this.trackId = trackId
    const randomIndex = (Math.ceil(Math.random() * 10)) % 10
    this.color = Colors[randomIndex]
    this.callback = callback
    this.creator() 
  }

  public creator(): void {
    this.evtcenter.publish(CustomEventType.Console, `${this.timestamp} 收到起跑指令，开始出击！</span>`, this.color, this.trackId)
    this.timer = window.setTimeout((t: string) => {
      this.evtcenter.publish(CustomEventType.Console, t, this.color, this.trackId)
      this.evtcenter.publish(CustomEventType.Update, this)
    }, 10000 * Math.random(), `----- ${this.timestamp} 抵达终点！ ----`)
  }

  public abort(): void {
    if (this.timer) {
      window.clearTimeout(this.timer)
      this.evtcenter.publish(CustomEventType.Console, `${this.timestamp} 被中途淘汰！`, this.color, this.trackId)
      this.evtcenter.unsubscribe(CustomEventType.RaceReached, this)
    }
  }

  public succ(): void {
    this.evtcenter.publish(CustomEventType.Console, `***** ${this.timestamp} 获得奖牌！ *****`, this.color, this.trackId)
    this.callback(this)
  }

  public listener(trigger: Observer): void {
    if (trigger.timestamp < this.timestamp || trigger.trackId !== this.trackId) return
    if (trigger.timestamp === this.timestamp) { this.succ() }
    if (trigger.timestamp === 0 || trigger.timestamp > this.timestamp) { this.abort() }

    this.evtcenter.unsubscribe(CustomEventType.RaceReached, this)
  }
}

class Subject {
  private _target: null | Observer = null
  private evtcenter: EventCenter

  constructor(evtcenter: EventCenter) { this.evtcenter = evtcenter }

  get target(): null | Observer { return this._target }
  set target(ob: null | Observer) {
    const old = this._target
    this._target = ob
    if (!ob) return
    if (old && old.timestamp === ob.timestamp) return
    this.evtcenter.publish(CustomEventType.RaceReached, <Observer>ob)
  }
}

export default function () {
  Creator.className = 'btn'
  const evtcenter = new EventCenter()
  const view = new View()
  const subject = new Subject(evtcenter)
  evtcenter.subscribe(CustomEventType.RaceReset, () => {
    subject.target = null
    view.reset()
  })
  evtcenter.subscribe(CustomEventType.CreateTrack, () => view.add())
  evtcenter.subscribe(CustomEventType.Console, (text: string, color: string, index: number) => {
    view.console(text, color, index)
  })
  evtcenter.subscribe(CustomEventType.Update, (ob: Observer) => subject.target = ob)

  Race.addEventListener('click', _ => {
    if (view.tracks.length === 0) return alert('请先创建赛道')
    const trackId = view.getTrack()
    const observer = new Observer((ob: Observer) => {
      evtcenter.publish(CustomEventType.Console, '获奖者当然要接受赛后采访啦！', ob.color, ob.trackId)
    }, evtcenter, trackId)
    evtcenter.subscribe(CustomEventType.RaceReached, observer)
  })
  Reset.addEventListener('click', _ => evtcenter.publish(CustomEventType.RaceReset, ''))
  Creator.addEventListener('click', _ => evtcenter.publish(CustomEventType.CreateTrack, ''))
}

