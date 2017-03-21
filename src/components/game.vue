<template>
  <div :class="config.theme">
    <vue-drr :w='180' :h='180' :r='0' class="scoreboard" :resizeable="false" :rotatable='false'>
      <h3>计分板</h3>
      旗帜数量： {{flagCount}} <br><br>
      分数： {{score}}
    </vue-drr>
    <div class="game-config">
      <form action="" @submit.prevent="init">
        <label>行: <input type="number" min="2" :max="config.maxRow" v-model="inputRow"></label>
        <label>列: <input type="number" min="2" :max="config.maxCol" v-model="inputCol"></label>
        <label>雷的数量: <input type="number" min="1" :max="~~inputRow * ~~inputCol - 1" v-model="inputBombCount"></label>
        <button type="submit">生成</button>
      </form>
      <div v-if="showTips" class="game-config-tips">{{ tipsText }}</div>
    </div>
    <table :width="width" class="game" :class="{'tips-open': showTips}" @click="handleClick" @contextmenu.prevent="handleRightClick" @dblclick="handleDblClick">
      <tr :key="row" v-for="(rows, row) in cellData">
        <cell :key="col" v-for="(cell, col) in rows" :row="cell.row" :col="cell.col" :isBomb="cell.isBomb" :status="cell.status" :isFlag="cell.isFlag" :bombCount="cell.bombCount"></cell>
      </tr>
    </table>
    <div v-if="gameOver" class="gameover layer">
      <div>Game Over</div>
      <div>你美丽了!</div>
      <div class="retry"><a href="#" @click.prevent="init">再试一次</a></div>
      <div class="retry"><a href="#" @click.prevent="view">查看雷的位置</a></div>
    </div>
    <div v-if="success" class="success layer">
      <div>Win!</div>
      <div>你成功了!</div>
      <div class="retry"><a href="#" @click.prevent="init">我还要玩</a></div>
    </div>
    <div v-if="viewBomb" class="layer-transparent"></div>

  </div>
</template>
<script>
  import cell from './cell'
  import config from '../config'
  import Utils from '../utils'
  import VueDRR from 'vue-drag-resize-rotate'

  /* F**k IE */
  const createRightClickEvent = (function () {
    return 'ActiveXObject' in window ? function () {
      let evt = document.createEvent('MouseEvent')
      evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      return evt
    } : function () {
      let evt = new MouseEvent('click', {
        button: 0,
        bubbles: true
      })
      return evt
    }
  })()

  export default {
    name: 'game',
    components: {
      cell,
      'vue-drr': VueDRR
    },
    data () {
      return {
        config: Object.assign({}, config),
        gameOver: false,
        cellData: [],
        showTips: false,
        viewBomb: false,
        width: 0,
        flagCount: 0,
        score: 0,
        inputRow: config.row,
        inputCol: config.col,
        inputBombCount: config.bombCount,
        bombSet: new Set(),
        success: false,
        tipsText: ''
      }
    },
    mounted () {
      this.init()
    },
    computed: {
      cellCount () {
        return this.config.col * this.config.row
      }
    },
    watch: {
      score (val) {
        if (val === this.cellCount - this.config.bombCount) {
          let $this = this
          this.bombSet.forEach(e => {
            let col = e % $this.config.col
            let row = ~~(e / $this.config.col)
            $this.cellData[row][col].isFlag = 1
          })
          this.$forceUpdate()
          this.score = this.cellCount
          this.flagCount = this.config.bombCount
          this.success = true
        }
      }
    },
    methods: {
      view () {
        this.gameOver = false
        this.viewBomb = true
        let $this = this
        this.bombSet.forEach(e => {
          let col = e % $this.config.col
          let row = ~~(e / $this.config.col)
          $this.cellData[row][col].status = 1
        })
        this.$forceUpdate()
      },
      init () {
        if ((~~this.inputCol) > this.config.maxCol || (~~this.inputRow) > this.config.maxRow) {
          this.tipsText = '请勿作死设置过大行列！'
          this.showTips = true
          this.inputRow = this.config.row
          this.inputCol = this.config.col
          this.inputBombCount = this.config.bombCount
          return
        }
        this.config.col = ~~this.inputCol
        this.config.row = ~~this.inputRow
        if ((~~this.inputBombCount) >= this.cellCount) {
          this.tipsText = '雷的数量最大为格子数量减1'
          this.showTips = true
          this.inputBombCount = this.cellCount - 1
          return
        }
        this.config.bombCount = ~~this.inputBombCount
        this.showTips = false
        this.success = false
        this.gameOver = false
        this.viewBomb = false
        this.score = 0
        this.flagCount = 0
        this.width = this.config.col * 41 + 1
        this.cellData = this.initData()
      },
      initData () {
        this.bombSet = Utils.randomBomb(this.config.bombCount, this.config.col * this.config.row)
        let result = []
        console.time('map')
        result = Array(this.config.row).fill(0).map((e, row) => {
          return Array(this.config.col).fill(0).map((e, col) => {
            return {
              status: 0,
              isFlag: false,
              row,
              col,
              isBomb: this.bombSet.has(row * this.config.col + col),
              bombCount: 0,
              isTriggered: false
            }
          })
        })
        console.timeEnd('map')
        return result
      },
      fail () {
        this.gameOver = true
      },
      handleClick (ev) {
        if (ev.target.nodeName !== 'TD') return
        let col = ev.target.cellIndex
        let row = ev.target.parentNode.rowIndex
        let cell = this.cellData[row][col]
        if (cell.status !== 0) return
        let clickType = ev.button
        if (clickType === 0) {
          if (!cell.isFlag) {
            cell.status = 1
            if (cell.isBomb) {
              this.$forceUpdate()
              this.fail()
              return
            }
            this.score++
            let aroundCell = this.getAroundCell(row, col)
            cell.bombCount = aroundCell.reduce(function (sum, cell) {
              return sum + (cell.isBomb ? 1 : 0)
            }, 0)
            if (cell.bombCount === 0) {
              let table = this.$el.querySelector('table')
              let nextTick = this.$nextTick
              cell.isTriggered = true
              aroundCell.forEach(e => {
                if (e.isTriggered || e.isFlag || e.status === 1) return
                // TODO: cell展开性能优化
                let evt = createRightClickEvent()
                nextTick(() => {
                  table.rows[e.row].cells[e.col].dispatchEvent(evt)
                })
              })
            }
            this.$forceUpdate()
          }
        } else if (clickType === 2) {
        }
      },
      handleRightClick (ev) {
        if (ev.target.nodeName !== 'TD') return
        let col = ev.target.cellIndex
        let row = ev.target.parentNode.rowIndex
        let cell = this.cellData[row][col]
        if (cell.status === 1) return
        if (!cell.isFlag) {
          this.flagCount++
          cell.isFlag = true
        } else {
          this.flagCount--
          cell.isFlag = false
        }
        this.$forceUpdate()
      },
      handleDblClick (ev) {
        if (ev.target.nodeName !== 'TD') return
        let col = ev.target.cellIndex
        let row = ev.target.parentNode.rowIndex
        let cell = this.cellData[row][col]
        if (cell.status !== 1) return
        let table = this.$el.querySelector('table')
        let aroundCell = this.getAroundCell(row, col)
        let nextTick = this.$nextTick
        cell.isTriggered = true
        aroundCell.forEach(e => {
          if (e.isTriggered || e.isFlag || e.status === 1) return
          // TODO: cell展开性能优化
          let evt = createRightClickEvent()
          nextTick(() => {
            table.rows[e.row].cells[e.col].dispatchEvent(evt)
          })
        })
      },
      getAroundCell (row, col) {
        let rowArr = [row - 1, row, row + 1]
        let colArr = [col - 1, col, col + 1]
        let resultArr = []
        let $vm = this
        rowArr.forEach(r => {
          colArr.forEach(c => {
            if ((r === row && c === col) || (r < 0 || r >= $vm.config.row) || (c < 0 || c >= $vm.config.col)) return
            resultArr.push($vm.cellData[r][c])
          })
        })
        return resultArr
      }
    }
  }
</script>
<style scoped>
  .scoreboard.dragable{
    position: fixed;
    z-index: 99;
    max-width: 180px;
    max-height: 180px;
    min-height: 180px;
    min-width: 180px;
    user-select: none;
    cursor: move;
    top: 100px;
    left: 100px;
  }
</style>
<style>
  body, button, input{
    font-family: Arial, Microsoft Yahei;
  }
  .scoreboard.dragable .scale{
    display: none;
  }
  .game{
    margin: 0 auto;
    border-spacing: 0;
    border-collapse: collapse;
    user-select: none;
    text-align: center;
    margin-top: 65px;
  }
  .game.tips-open{
    margin-top: 97px;
  }
  .game-config{
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    background-color: #fff;
    flex-wrap: wrap;
  }
  .game-config label{
    margin-right: 5px;
  }
  .game-config-tips{
    width: 100%;
    margin-top: 10px;
    text-align: center;
    color: #f36;
    font-weight: bold;
  }
  td{
    width: 30px;
    height: 30px;
    border: 1px solid;
    padding: 0;
  }
  .layer{
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 100px;
    font-weight: bold;
    color: #f36;
    font-family: Arial, Microsoft Yahei;
    background-color: rgba(255, 255, 255, .7);
  }
  .layer-transparent{
    position: fixed;
    z-index: 90;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .layer > div{
    width: 100%;
  }
  .layer .retry a{
    font-size: 40px;
    text-decoration: none;
    color: #06f;
  }
  .gameover{
    color: #f36;
  }
  .success{
    color: #09BB07;
  }

  /* theme */
  /* classic */
  .classic .game{
    border-collapse: separate;
    font-family: Courier, Arial, Microsoft Yahei;
    font-size: 30px;
    font-weight: bold;
    border-spacing: 1px;
    background-color: #666; 
  }
  .classic .status0{
    width: 30px;
    height: 30px;
    border-style: solid;
    border-width: 5px;
    border-color: #eee #aaa #aaa #eee;
    background-color: #ddd;
    cursor: pointer;
  }
  .classic .bomb, .classic .flag{
    color: #f36;
    font-size: 24px;
    font-family: FontAwesome;
    font-weight: normal;
    text-rendering: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .classic .flag{
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-style: solid;
    border-width: 5px;
    border-color: #eee #aaa #aaa #eee;
    background-color: #ddd;
  }
  .classic .bomb{
    width: 38px;
    height: 38px;
    border: 1px solid #666;
    background-color: #ccc;
    cursor: default;
  }
  .classic [class^=bomb-count-]{
    width: 38px;
    height: 38px;
    border: 1px solid #666;
    background-color: #ccc;
    cursor: default;
  }
  .classic .bomb-count-0{
  }
  .classic .bomb-count-1{
    color: #00f;
  }
  .classic .bomb-count-2{
    color: #080;
  }
  .classic .bomb-count-3{
    color: #f00;
  }
  .classic .bomb-count-4{
    color: #008;
  }
  .classic .bomb-count-5{
    color: #800;
  }
  .classic .bomb-count-6{
    color: #088;
  }
  .classic .bomb-count-7{
    color: #000;
  }
  .classic .bomb-count-8{
    color: #808;
  }

</style>
