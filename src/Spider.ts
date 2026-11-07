import type ISpider from "#root/interface/Spider.js"
import type { ScreenShotConf, Mode } from "#root/interface/Spider.js"
import { existsSync, mkdirSync } from "node:fs"
import * as os from "node:os"
import puppeteer from "puppeteer-core"
import type {
  Browser,
  CookieParam,
  GoToOptions,
  LaunchOptions,
  Page,
} from "puppeteer-core"
import { pseudoChrome, scriptNameMapPath } from "#conf/app.js"

declare let window: Window & { chrome: any }

export default class Spider implements ISpider {
  startTime?: Date
  pages: Page[] = []
  browser?: Browser
  constructor(public readonly mode: Mode = "prod") {}
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
      const originalQuery = window.navigator.permissions.query.bind(
        window.navigator.permissions,
      )
      window.navigator.permissions.query = parameters =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters)
      //插件这个不要写
      // Object.defineProperty(navigator, 'plugins', {
      //   get: () => [1, 2, 3, 4, 5],
      // });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en", "zh-CN", "zh"],
      })
      Object.defineProperty(navigator, "language", {
        get: () => ["en"],
      })
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })
    })
  }
  async setRequestInterception(page: Page) {
    await page.setRequestInterception(true)
    page.on("request", interceptedRequest => {
      const reqUrl = interceptedRequest.url()
      let suffix = ""
      const urlSplitArr = reqUrl.split(".")
      if (urlSplitArr.length > 1) {
        suffix = urlSplitArr.pop() as string
      }
      const disableSuffixArr = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "woff", "woff2", "ttf"]
      const resourceType = interceptedRequest.resourceType()
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        disableSuffixArr.includes(suffix)
      ) {
        void interceptedRequest.abort()
      } else {
        void interceptedRequest.continue()
      }
    })
  }
  async setMaxViewport(page: Page, headless: boolean) {
    const availWidth =
      os.platform() === "win32" && !headless
        ? await page.evaluate(() => {
            console.log(screen.availWidth)
            return screen.availWidth
          })
        : 1920
    return await page.setViewport({
      width: availWidth,
      height: 1080,
    })
  }
  async screenShot(page: Page, conf: ScreenShotConf) {
    const { fileName, fullPage, path } = conf
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
    await page.screenshot({
      path: path + "/" + fileName + ".png",
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
      throw new Error("browser not init!")
    }
    await this.browser.close()
  }
  async setCookie(page: Page, cookie: CookieParam[]) {
    await page.setCookie(...cookie)
  }
}
