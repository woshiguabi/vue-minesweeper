<template>
  <td :class="className">{{display}}</td>
</template>
<script>
  import Utils from '../utils'
  import config from '../config'
  export default {
    name: 'cell',
    props: ['row', 'col', 'isBomb', 'status', 'isFlag', 'bombCount'],
    computed: {
      display () {
        return Utils.getCellStatus(config.cellDisplayText, this)
      },
      className () {
        return Utils.getCellStatus(config.cellClassName, this)
      }
    }
  }
</script>
