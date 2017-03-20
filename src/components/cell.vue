<template>
  <td :class="className">{{display}}</td>
</template>
<script>
  import Utils from '../utils'
  export default {
    name: 'cell',
    props: ['row', 'col', 'isBomb', 'status', 'isFlag', 'bombCount'],
    computed: {
      display () {
        return Utils.getCellStatus({
          isFlag: '',
          status0: '',
          isBomb: '雷',
          bombCount: '',
          bombCount0: ''
        }, this)
      },
      className () {
        return Utils.getCellStatus({
          isFlag: 'flag fa-flag',
          status0: 'status0',
          isBomb: 'bomb',
          bombCount: 'bomb-count-',
          bombCount0: 'bomb-count-0'
        }, this)
      }
    }
  }
</script>
