import { Page, Browser, LaunchOptions, DirectNavigationOptions, SetCookie } from "puppeteer-core"

export interface ScreenShotConf {
  // 存储路径
  path: string
  // 截屏文件名
  fileName: string
  // 全屏
  fullPage?: boolean
}
export default interface ISpider {
  startTime?: Date
  pages: Page[]
  browser?: Browser
  // 启动 chromium
  launch(conf: LaunchOptions): Promise<any>
  // 设置 ua
  setUserAgent(page: Page, userAgent: string): Promise<any>
  // 设置最大化
  setMaxViewport(page: Page): Promise<any>
  // 截屏
  screenShot(page: Page, conf: ScreenShotConf): Promise<any>
  // 注入脚本
  addScript(page: Page, scriptName: string): Promise<any>
  go(page: Page, url: string, opts?: DirectNavigationOptions): Promise<any>
  shutdown(): Promise<any>
  setCookie(page: Page, cookies: SetCookie[]): Promise<any>
}
