export const Race = <HTMLElement>document.getElementById('race_btn')
export const Reset = <HTMLElement>document.getElementById('reset_btn')
export const Creator = <HTMLElement>document.getElementById('create_btn')
export const Colors = ['#6A6AFF', '#FF60AF', '#FFDC35', '#B87070', '#5CADAD', '#B766AD', '#7B7B7B', '#E6CAFF', '#DFFFDF', '#FFFFDF']

const board = <HTMLElement>document.getElementById('race_console')
export const Board = {
  el: board,
  console(text: string, color: string) {
    const o = Board.el.innerHTML
    const n = `
      ${o}
      <br>
      <span style="color: ${color}">${text}</span>
    `
    Board.el.innerHTML = n
  }
}