import Spider from "@/Spider"
import { launchOpt, userAgent, screenShotDir } from "@conf/app"
import cookies from "@conf/sina/cookie"
import { writeFileSync } from "fs"
import moment from "moment"
import path from "path"
export default class App {
  spider: Spider
  constructor() {
    this.spider = new Spider()
  }
  async login() {
    await this.spider.launch(launchOpt)
    const page = this.spider.pages[0]
    await this.spider.go(page, "https://weibo.com", {
      waitUntil: "domcontentloaded",
    })
    await this.spider.setMaxViewport(page, !!launchOpt.headless)
    await this.spider.setUserAgent(page, userAgent)
    console.log("正在等待重定向")
    // 等待重定向 并且登陆按钮出来
    await page.waitForSelector(
      "#weibo_top_public > div > div > div.gn_position > div.gn_login > ul > li:nth-child(3) > a",
    )
    console.log("重定向完成")
    // 个人信息,关注,微博总数div
    await page
      .waitForSelector("#v6_pl_rightmod_myinfo > div > div > div.WB_innerwrap > ul", {
        timeout: 5 * 60 * 1000,
      })
      .catch(() => {
        throw new Error("Error: 5分钟内还没有完成登陆!")
      })
    console.log("登陆完成")
    let cookies = await page.cookies("https://weibo.com", "https://sina.com.cn")
    cookies.map(cookie => {
      delete cookie["size"]
      return cookie
    })
    const cookieStr = JSON.stringify(cookies)
    writeFileSync(path.resolve(__dirname, "../../config/sina/cookies.ts"), cookieStr, {
      flag: "w+",
    })
    this.spider.shutdown()
    console.log("Success!")
  }
  async start() {
    await this.spider.launch(launchOpt)
    const page = this.spider.pages[0]
    page.on("console", msg => console.log("PAGE LOG:", msg.text()))
    await this.spider.setCookie(page, cookies)
    await this.spider.setUserAgent(page, userAgent)
    await this.spider.go(page, "https://weibo.com", {
      waitUntil: "domcontentloaded",
    })
    await this.spider.setMaxViewport(page, !!launchOpt.headless)
    await page
      .waitForSelector("#v6_pl_rightmod_myinfo > div > div > div.WB_innerwrap > ul", {})
      .catch(() => {
        throw new Error("cookie 登陆失败!")
      })
    await this.spider.screenShot(page, {
      fileName: "首页-" + moment().format("YYYY-MM-DD HH-mm-ss.SSS"),
      fullPage: true,
      path: screenShotDir + "/sina",
    })
    await this.spider.shutdown()
    console.log("Success!")
  }
}
