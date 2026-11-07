import Spider from "#root/Spider.js"
import { launchOpt, userAgent, screenShotDir } from "#conf/app.js"
import cookies from "#conf/sina/cookie.js"
import { mkdirSync, writeFileSync } from "node:fs"
import moment from "moment"
import * as path from "node:path"
import type { Page } from "puppeteer-core"

export interface Content {
  publishTime: string
  text: string
  publishPhone: string
}
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
    // size 是新版 Cookie 的必填字段，不属于 CookieParam，写入前剔除
    const rawCookies = await page.cookies("https://weibo.com", "https://sina.com.cn")
    const cleaned = rawCookies.map(({ size, ...cookie }) => cookie)
    const cookieModule = [
      'import type { CookieParam } from "puppeteer-core"',
      "",
      `const cookies = ${JSON.stringify(cleaned, null, 2)} as unknown as CookieParam[]`,
      "",
      "export default cookies",
      "",
    ].join("\n")
    const cookieFile = path.resolve(
      import.meta.dirname,
      "../../../src/config/sina/cookie.ts",
    )
    mkdirSync(path.dirname(cookieFile), { recursive: true })
    writeFileSync(cookieFile, cookieModule, { flag: "w+" })
    await this.spider.shutdown()
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
    console.log("已登陆")
    // 进入用户首页
    await this.goUserPage(page, 1)
    console.log("所有页面内容抓取完毕")
    await this.spider.shutdown()
  }
  async goUserPage(page: Page, currPage: number) {
    await this.spider.go(
      page,
      "https://weibo.com/laruence?is_all=1&profile_ftype=1&page=" + currPage,
      {
        waitUntil: "domcontentloaded",
      },
    )
    // 加载页面全部
    for (let i = 0; i < 5000; i++) {
      try {
        await page.waitForSelector("#Pl_Official_MyProfileFeed__19 > div > div:nth-child(47)", {
          timeout: 50,
        })
        break
      } catch (e) {
        await page.evaluate(() => {
          window.scrollTo(0, 999999999)
        })
      }
    }
    console.log("页面内容加载完毕")
    await this.spider.screenShot(page, {
      fileName: `laruence用户第${currPage}页-` + moment().format("YYYY-MM-DD HH-mm-ss.SSS"),
      fullPage: true,
      path: screenShotDir + "/sina/users/laruence",
    })
    // 获取页面所有内容
    await this.spider.addScript(page, "jquery")
    const contents: Content[] = await page.evaluate(() => {
      const contents: Content[] = []
      return new Promise<Content[]>(s => {
        const $weibos = $("#Pl_Official_MyProfileFeed__19 > div > div[minfo]")
        const weiboLen = $weibos.length
        $weibos.each(function() {
          let publishTime =
            $(this)
              .find("div.WB_detail > div.WB_from.S_txt2 > a:nth-child(1)")
              .attr("date") || ""
          if (publishTime) {
            publishTime = new Date(parseInt(publishTime)).toISOString()
          }
          contents.push({
            publishPhone: $(this)
              .find("div.WB_detail > div.WB_from.S_txt2 > a:nth-child(1)")
              .text(),
            publishTime,
            text:
              $(this)
                .find("div.WB_detail > div.WB_text.W_f14")
                .html() || "",
          })
          if (contents.length === weiboLen) {
            s(contents)
          }
        })
      })
    })
    console.log(`第${currPage}页内容:`)
    console.log(contents)
    // 判断是否有下一页
    const hasNextPage = await page.evaluate(() => {
      return new Promise<boolean>(s => {
        let hasNextPage = false
        const $button = $("div.W_pages > span.list + a")
        if ($button.length === 1) {
          hasNextPage = $button.text() === "下一页"
        }
        s(hasNextPage)
      })
    })
    if (hasNextPage) {
      await this.goUserPage(page, currPage + 1)
    }
  }
}
