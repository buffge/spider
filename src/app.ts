import { launchOpt, userAgent } from '@conf/app'
import Spider from './Spider'

export default class App {
  spider: Spider
  site = 'https://www.xiaommx.cn'
  constructor() {
    this.spider = new Spider()
  }
  async start() {
    await this.spider.launch(launchOpt)
    const page = this.spider.pages[0]
    page.on('console', msg => console.log('PAGE LOG:', msg.text()))
    await this.spider.setUserAgent(page, userAgent)
    await page.setJavaScriptEnabled(false)
    await this.spider.go(page, `${this.site}/no-use/library-itch`, {
      waitUntil: 'domcontentloaded',
    })
    await this.spider.setMaxViewport(page, !!launchOpt.headless)
    const content = await page.content()
    const indexJsPath = await page.evaluate((content: string) => {
      const res = /<script type="module" crossorigin="" src="(.+?)"/.exec(content)
      if (!res || res.length < 2) {
        return
      }
      return res[1]
    }, content)
    const modulesJsPath = await page.evaluate((content: string) => {
      const res = /<link rel="modulepreload" crossorigin="" href="(\/assets\/vendor-modules-.+?)">/.exec(content)
      if (!res || res.length < 2) {
        return
      }
      return res[1]
    }, content)
    await delay(1000)
    await page.setRequestInterception(true)
    let js2Path = ''
    await page.on('request', async req => {
      const url = req.url()
      if (!url.startsWith('http')) {
        return req.continue()
      }
      // if (url.endsWith('.js')) {
      // console.log(46, url)
      // }
      if (url === this.site + indexJsPath) {
        const resp = await fetch(req.url())
        let content = await resp.text()
        content = content.replace(/,this,function\(\){(.+?);/, ',this,function(){$1;//buff-hack3\nreturn;')
        content = content.replace(/'nickname':.+?,/, `'nickname':'b站-传说的buff',`)
        const reg = /import\('.\/(index-.+?)'\)/g
        reg.exec(content)
        const res = reg.exec(content)
        if (!res || res.length < 2) {
          throw new Error('逻辑js查找失败')
        }
        js2Path = `/assets/${res[1]}`
        req.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body: content,
        })
        return
      }
      if (url === this.site + modulesJsPath) {
        const resp = await fetch(req.url())
        let content = await resp.text()
        content = content.replace(
          /\}var (.{2})=.{2}?\(\);const (.{2}=.{2})\(\1\);/,
          '}/* buff-hack1 $1*/var $1=()=>{};const $2($1); ',
        )
        req.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body: content,
        })
        return
      }
      if (js2Path !== '' && url === this.site + js2Path) {
        const resp = await fetch(req.url())
        let content = await resp.text()
        content = content.replace(/\}\);([^;]+?);import\{/, '});/* buff-hack2 // $1;*/import{')
        content = content.replace(
          /;async function ([^(]+)\(\)\{/,
          ';window.buff_f1_startGameSession = $1;async function $1() {window.buff_v1_startGameTms = Date.now();',
        )
        content = content.replace(
          /\)\]\};try{const ([^=]+?)=await (.+?)\['startGameSession'\]\(\);/,
          `)]};try{const $1=await $2['startGameSession']();window.buff_v2_serverStartGameTs=JSON.parse(decodeURIComponent(atob($1.token.split('.')[1]))).startTime;`,
        )
        content = content.replace(/\+=0x5/, '-=0x5')
        content = content.replace(
          /\);async function (.+?)\((.+?)\]\)\{const (.+?),[^)]+?\);await(.+?)\]\((.+?)\[/,
          // `);window.buff_f2_submitScore = () => { $1('caught') };async function $1($2]){let score = Math.floor((Date.now() - window.buff_v1_startGameTms)* 9 / 1000) ;$5['value'] = score;const $3await$4]($5[`,
          // `);window.buff_f2_submitScore = () => { $1('caught') };async function $1($2]){let score = (Date.now() - window.buff_v1_startGameTms)* 9 / 1000 ;$5['value'] = score;const $3await$4]($5[`,
          // `);window.buff_f2_submitScore = () => { $1('caught') };async function $1($2]){let score = window.buff_v3_dealyTs * 9 ;$5['value'] = score;const $3await$4]($5[`,
          `);window.buff_f2_submitScore = () => { $1('caught') };async function $1($2]){let score = 7200 * 9 ;$5['value'] = score;const $3,7200*1000);await$4]($5[`,
        )
        req.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body: `${content}`,
        })
        // page.setJavaScriptEnabled(false)
        return
      }
      const reqUrl = req.url()
      let suffix = ''
      const urlSplitArr = reqUrl.split('.')
      if (urlSplitArr.length > 1) {
        suffix = urlSplitArr.pop() as string
      }
      const disableSuffixArr = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'woff', 'woff2', 'ttf']
      const resType = req.resourceType()
      if (
        resType === 'image' ||
        resType === 'font' ||
        resType === 'ping' ||
        resType === 'media' ||
        disableSuffixArr.includes(suffix)
      ) {
        req.abort()
        return
      }
      req.continue()
    })
    await page.on('response', async resp => {
      if (!resp.request().hasPostData()) {
        return
      }
      const url = resp.request().url()
      if (url === 'https://api.xiaommx.cn/no-use/library-itch/submit-score') {
        if (resp.status() !== 200) {
          console.log(resp.status(), resp.statusText(), await resp.text())
          return
        }
        const data = await resp.json()
        const score = data.score
        console.log(
          `获得分数${score},top1Score:${data.godLeaderboard[0].s},top1Name:${data.godLeaderboard[0].n},now:${Date.now()}`,
        )
      }
    })
    await page.setJavaScriptEnabled(true)
    await page.reload({
      waitUntil: 'networkidle0',
    })
    const env = process.env
    const delayTs = parseFloat(env.DELAY_TS || '5')
    const uid = env.XMMX_UID || '3346983318'
    await page.evaluate(
      ({ delayTs, uid }) => {
        ;(async () => {
          localStorage.setItem('XMMX_FINGERPRINT', uid)
          console.log(`uid:${uid},delayTs:${delayTs},now:${Date.now()}`)
          await fetch('https://api.xiaommx.cn')
          await window.buff_f1_startGameSession()
          window.buff_v3_dealyTs = delayTs
          // const delayTime = window.buff_v2_serverStartGameTs * 1000 + delayTs * 1000 - Date.now()
          const delayTime = delayTs * 1000
          console.log(
            157,
            delayTs,
            window.buff_v1_startGameTms,
            window.buff_v2_serverStartGameTs,
            delayTime,
            Date.now() + delayTime,
          )
          setTimeout(() => {
            fetch('https://api.xiaommx.cn')
          }, delayTime - 3000)
          setTimeout(window.buff_f2_submitScore, delayTime)
        })()
      },
      { delayTs, uid },
    )
    await delay((delayTs + 3) * 1000)
    await this.spider.shutdown()
  }
}
export async function delay(tms: number) {
  return new Promise(s => {
    setTimeout(s, tms)
  })
}
