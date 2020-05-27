import { Race, Reset, Board, Colors } from '../el'

interface Evt {
  id: number
  flag: number,
  fun: Function
}

let target: number = 0
let poll: Array<Evt> = []

function trigger(id: number) {
  const item = poll.find(x => x.id === id)
  if (item && item.id > target) {
    target = item.id
    item.fun()
  }
  const droped = poll.splice(0, id+1)
  while (droped.length > 0) {
    const e = droped.shift()
    if (e && e.flag) { window.clearTimeout(e.flag) }
  }
}


export default function () {

  Race.addEventListener('click', _ => {
    const id  = poll.length
    Board.console(`${id} 收到起跑指令，开始出击！`, Colors[id])
    const flag = window.setTimeout(() => {
      Board.console(`${id} 到达终点！`, Colors[id])
      trigger(id)
    }, 10000 * Math.random())
    poll.push({
      id,
      flag,
      fun() { Board.console(`${id} 领取奖牌！`, Colors[id]) }
    })
    
  })

  Reset.addEventListener('click', _ => {
    poll = []
    Board.el.innerHTML = ''
  })
}

