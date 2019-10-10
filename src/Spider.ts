import ISpider, { ScreenShotConf } from "@/interface/Spider"
import * as os from "os"
import puppeteer, {
  LaunchOptions,
  Page,
  Browser,
  DirectNavigationOptions,
  SetCookie,
} from "puppeteer-core"
import { scriptNameMapPath } from "./config/app"
export default class Spider implements ISpider {
  startTime?: Date
  pages: Page[] = []
  browser?: Browser

  constructor() {}
  start() {}
  async launch(opts: LaunchOptions) {
    this.startTime = new Date()
    this.browser = await puppeteer.launch(opts)
    this.pages[0] = await this.browser.newPage()
  }
  async setUserAgent(page: Page, userAgent: string) {
    await page.setUserAgent(userAgent)
  }
  async setMaxViewport(page: Page) {
    let availWidth =
      os.platform() === "win32"
        ? await page.evaluate(() => {
            return screen.availWidth
          })
        : 1920
    return await page.setViewport({
      width: availWidth,
      height: 1080,
    })
  }
  async screenShot(page: Page, conf: ScreenShotConf) {
    console.log(conf, page)
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
