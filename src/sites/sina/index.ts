import Spider from "@/Spider"
import { launchOpt, userAgent } from "@conf/app"
import delay from "delay"
import cookies from "@conf/sina/cookie"
export default class App {
  spider: Spider
  constructor() {
    this.spider = new Spider()
  }
  start = async () => {
    await this.spider.launch(launchOpt)
    const page = this.spider.pages[0]
    await this.spider.setCookie(page, cookies)
    await this.spider.go(page, "https://weibo.com", {
      waitUntil: "domcontentloaded",
    })
    await this.spider.setMaxViewport(page)
    await this.spider.setUserAgent(page, userAgent)
    await delay(5000)
  }
}
