const Utils = {}
Utils.randomBomb = function (bombCount, cellCount) {
  console.time('random')
  console.log(bombCount, cellCount)
  if (bombCount > cellCount) {
    bombCount = cellCount
  }
  const cellArr = Array(cellCount).fill(false)
  let resultArr = Array(bombCount).fill(1).map(function uniqueRandom () {
    let randomIndex = ~~(Math.random() * cellCount)
    if (!cellArr[randomIndex]) {
      cellArr[randomIndex] = true
      return randomIndex
    } else {
      return uniqueRandom()
    }
  })
  console.log(resultArr)
  let result = new Set()
  resultArr.forEach(e => result.add(e))
  console.timeEnd('random')
  return result
}

Utils.getCellStatus = function (result, cell) {
  return cell.isFlag ? result.isFlag : (
    cell.status === 0 ? result.status0 : (
      cell.isBomb ? result.isBomb : (
        cell.bombCount > 0 ? result.bombCount + cell.bombCount : result.bombCount0
      )
    )
  )
}

export default Utils
