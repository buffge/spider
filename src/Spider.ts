import ISpider, { ScreenShotConf, Mode } from "@/interface/Spider"
import { existsSync, mkdirSync } from "fs"
import * as os from "os"
import puppeteer, {
  Browser,
  DirectNavigationOptions,
  LaunchOptions,
  Page,
  SetCookie,
} from "puppeteer-core"
import { pseudoChrome, scriptNameMapPath } from "./config/app"
declare let window: Window & { chrome: any }
export default class Spider implements ISpider {
  startTime?: Date
  pages: Page[] = []
  browser?: Browser
  constructor(mode: Mode = "prod") {
    mode = mode
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
      let reqUrl = interceptedRequest.url()
      let suffix = ""
      let urlSplitArr = reqUrl.split(".")
      if (urlSplitArr.length > 1) {
        suffix = urlSplitArr.pop() as string
      }
      const disableSuffixArr = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "woff", "woff2", "ttf"]
      if (
        interceptedRequest.resourceType() === "image" ||
        interceptedRequest.resourceType() === "font" ||
        disableSuffixArr.includes(suffix)
      ) {
        interceptedRequest.abort()
      } else {
        interceptedRequest.continue()
      }
    })
  }
  async setMaxViewport(page: Page, headless: boolean) {
    let availWidth =
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
  async go(page: Page, url: string, opts: DirectNavigationOptions = {}) {
    await page.goto(url, opts)
  }
  async shutdown() {
    if (!this.browser) {
      throw new Error("browser not init!")
    }
    await this.browser.close()
  }
  async setCookie(page: Page, cookie: SetCookie[]) {
    await page.setCookie(...cookie)
  }
}
