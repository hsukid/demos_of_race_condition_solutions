# demos_of_race_condition_solutions
记录个人一些解决竞态问题的思路和demo

竞态问题大多发生在异步请求中，为了方便观察和理解，demo用setTimeout简单模拟了异步的不确定性。

### demo_1: 最简单的步进校验思路
当需要确定请求和处理的顺序时，我最直接的想法就是，每个请求都设置一个唯一的顺序标识。
```
const id  = evtpoll.step + 1
Board.console(`${id} 收到起跑指令，开始出击！`, Colors[id])
evtpoll.push({
  id,
  fun() { Board.console(`${id} 领取奖牌！`, Colors[id]) }
})
```
回调执行时，判断当前是否已存在比本标识更新的结果，有则中断，无则继续。

```
trigger(id: number) {
  const item = this.poll.find(x => x.id === id)
  if (item && item.id > this.target) {
    this.target = item.id
    item.fun()
  }
}
```
当然，在一些生产领域的应用中(比如游戏)，步进标识一般被服务端控制，通过response返回给客户端进行选择性消费，但我个人觉得如果单纯依赖服务端的步进标识会导致只能被动消费，无法主动中断已过期的请求。因此我觉得类似这样需要严格保持请求顺序的场景，前后端都需要做相应的处理才行。

具体代码请查看demo_1

### demo_2: 尝试不那么漏风呢？

我不知道demo1算不算最简单的实现，跳跃式的思维让我在试图复述最初那一瞬的想法时，总是夹杂便于之后演进的代码。
回到demo2，我想解决几个问题:

- 散装的变量和方法需要整理一下
- 回调和钩子过于耦合
- 驱动通知的角色应该便于管理，由回调承担则过于散乱
- 再丰满点
- 再精简点

就有这么一个观察者模式的雏形产生。当然，一般被观察对象的变化并不是由观察者引起的，在当前问题下观察者兼任了这个任务。

```
// class Observer
public creator(): void {
  Board.console(`${this.timestamp} 收到起跑指令，开始出击！</span>`, this.color)
  this.listener = window.setTimeout((t: string) => {
    Board.console(t, this.color)
    this.ep.target = this.timestamp
  }, 10000 * Math.random(), `----- ${this.timestamp} 抵达终点！ ----`)
}
```

集中管理了订阅、被观察对象。通知由被观察者对象的setter方法发起。

```
// blablabla...
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

```

更丰满？
```
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
```

更精简？
```
Race.addEventListener('click', _ => epoll.subscribe(() => console.log('获奖者当然要接受赛后采访啦！')))
  
```

### demo_3: 尝试更通用一点呢？

