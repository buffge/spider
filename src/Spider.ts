import { existsSync, mkdirSync } from 'node:fs'
import puppeteer, {
  type Browser,
  type CookieData,
  type GoToOptions,
  type LaunchOptions,
  type Page,
} from 'puppeteer-core'
import { pseudoChrome, scriptNameMapPath } from './config/app'
export interface ScreenShotConf {
  // 存储路径
  path: string
  // 截屏文件名
  fileName: string
  // 全屏
  fullPage?: boolean
}
export type Mode = 'debug' | 'prod'
declare let window: Window & { chrome: any }
export default class Spider {
  startTime?: Date
  pages: Page[] = []
  browser?: Browser
  mode: Mode
  constructor(mode: Mode = 'prod') {
    this.mode = mode
  }
  start() {}
  async launch(opts: LaunchOptions) {
    this.startTime = new Date()
    this.browser = await puppeteer.launch(opts)
    this.pages[0] = await this.browser.newPage()
  }
  async setUserAgent(page: Page, userAgent: string) {
    await page.setUserAgent(userAgent)
  }
  async setWebDriverMask(page: Page) {
    await page.evaluateOnNewDocument(() => {
      window.chrome = pseudoChrome
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = parameters =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters)
      //插件这个不要写
      // Object.defineProperty(navigator, 'plugins', {
      //   get: () => [1, 2, 3, 4, 5],
      // });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en', 'zh-CN', 'zh'],
      })
      Object.defineProperty(navigator, 'language', {
        get: () => ['en'],
      })
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
    })
  }
  async setRequestInterception(page: Page) {
    await page.setRequestInterception(true)
    page.on('request', interceptedRequest => {
      const reqUrl = interceptedRequest.url()
      let suffix = ''
      const urlSplitArr = reqUrl.split('.')
      if (urlSplitArr.length > 1) {
        suffix = urlSplitArr.pop() as string
      }
      const disableSuffixArr = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'woff', 'woff2', 'ttf']
      if (
        interceptedRequest.resourceType() === 'image' ||
        interceptedRequest.resourceType() === 'font' ||
        disableSuffixArr.includes(suffix)
      ) {
        interceptedRequest.abort()
      } else {
        interceptedRequest.continue()
      }
    })
  }
  async setMaxViewport(page: Page, headless: boolean) {
    const [width, height] = !headless
      ? await page.evaluate(() => {
          console.log(screen)
          return [screen.width, screen.height]
        })
      : [2560, 1440]
    return await page.setViewport({
      width: width,
      height: height,
    })
  }
  async screenShot(page: Page, conf: ScreenShotConf) {
    const { fullPage, path } = conf
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
    await page.screenshot({
      // path: path + "/" + fileName + ".png",
      fullPage: !!fullPage,
    })
  }
  async addScript(page: Page, scriptName: string) {
    await page.addScriptTag({
      path: scriptNameMapPath[scriptName],
    })
  }
  async go(page: Page, url: string, opts: GoToOptions = {}) {
    await page.goto(url, opts)
  }
  async shutdown() {
    if (!this.browser) {
      throw new Error('browser not init!')
    }
    await this.browser.close()
  }
  async setCookie(_: Page, cookie: CookieData[]) {
    await this.browser?.setCookie(...cookie)
  }
}
