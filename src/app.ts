import { createApp, provide } from 'vue'
import axios from 'axios'
// import VueClipboard from 'vue-clipboard2';
import store from './store'
import router from './router'
import App from '~/components/App.vue'
import UiCopyButton from '~/components/UiCopyButton.vue'
import UiAddress from '~/components/UiAddress.vue'
import UiTimeago from '~/components/UiTimeago.vue'
import UiModal from '~/components/UiModal.vue'
// import { IS_TESTNET } from '~/config.js'
import { formatFee, formatTons, formatFiat } from '~/helpers'
import i18n from '~/i18n'
import './sass/app.scss'
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from '@/ton-lite-client/src/index'

// Vue.use(VueClipboard);

// Vue.prototype.$http = axios;
// Vue.prototype.$bus = new Vue();

// Vue.prototype.$ton = formatTons;
// Vue.prototype.$fee = formatFee;
// Vue.prototype.$fiat = formatFiat;

// new Vue({ router, store, i18n,
//     el: '#app',
//     render: h => h(App),
//     created() {
//         if (IS_TESTNET) {
//             return console.debug('Not loading addressbook and exchange rates in testnet mode');
//         }

//         this.$store.dispatch('getAddrbook');
//         this.$store.dispatch('getExchangeRates');
//     },
// });

const app = createApp(App)

app.use(i18n)
app.use(router)
app.use(store)

app.component('UiCopyButton', UiCopyButton)
app.component('UiAddress', UiAddress)
app.component('UiTimeago', UiTimeago)
app.component('UiModal', UiModal)

app.config.globalProperties.$ton = formatTons
app.config.globalProperties.$fee = formatFee
app.config.globalProperties.$fiat = formatFiat

async function addLc() {
  interface queueItem {
    method: string
    args: unknown[]
    resolve: () => void
    reject: () => void
  }

  const queue: queueItem[] = []
  // eslint-disable-next-line prefer-const
  let lc: LiteClient | undefined
  // class TempWait {
  // private queue: queueItem[]
  // private lc: LiteClient

  // constructor() {
  //   this.queue = []
  // }

  const createShim = (name: string) => {
    return (...args: unknown[]) => {
      if (lc) {
        return lc[name](...args)
      }

      let _resolve
      let _reject
      const p = new Promise((resolve, reject) => {
        _resolve = resolve
        _reject = reject
      })

      queue.push({
        method: name,
        args: [...args],
        resolve: _resolve,
        reject: _reject,
      })

      return p
    }
  }
  const tempWait = {}
  for (const name of [
    'getMasterchainInfo',
    'getAccountState',
    'getAccountTransactions',
    'sendMessage',
    'getMasterchainInfoExt',
    'getCurrentTime',
    'getVersion',
    'getConfig',
    'getAccountTransaction',
    'runMethod',
    'lookupBlockByID',
    'getBlockHeader',
    'getAllShardsInfo',
    'listBlockTransactions',
    'getFullBlock',
  ]) {
    tempWait[name] = createShim(name)
  }

  const endWait = () => {
    for (const item of queue) {
      // console.log('item work', item, lc)
      if (lc && lc[item.method]) {
        lc[item.method](...item.args)
          .then(item.resolve)
          .catch(item.reject)
      }
    }
  }

  app.config.globalProperties.$lc = tempWait
  app.provide('$lc', tempWait)

  const configUrl =
    process.env.TONCONFIG_URL || 'https://ton-blockchain.github.io/testnet-global.config.json'

  const { data } = await axios(configUrl)

  const engines: LiteSingleEngine[] = []
  // while (engines.length < 50) {
  for (const ls of data.liteservers.slice(0, 1)) {
    engines.push(
      new LiteSingleEngine({
        host: `wss://ws.trcr.pw/?dest_host=${intToIP(ls.ip)}:${ls.port}`,
        // host: `ws://127.0.0.1:5999/?dest_host=${intToIP(ls.ip)}:${ls.port}`,
        publicKey: Buffer.from(ls.id.key, 'base64'),
      })
    )
  }
  // }

  const engine = new LiteRoundRobinEngine(engines)
  const liteClient = new LiteClient({ engine })

  app.config.globalProperties.$lc = liteClient
  app.provide('$lc', liteClient)
  lc = liteClient
  endWait()

  setInterval(async () => {
    liteClient.getMasterchainInfo()
  }, 30000)
}

addLc()

app.mount('#app')

function intToIP(int) {
  const part1 = int & 255
  const part2 = (int >> 8) & 255
  const part3 = (int >> 16) & 255
  const part4 = (int >> 24) & 255

  return `${part4}.${part3}.${part2}.${part1}`
}
