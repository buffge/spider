import * as path from "path"
import { LaunchOptions } from "puppeteer"
export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36"
export const screenShotDir: string = path.resolve(__dirname, "../../runtime/screenshot")
export const scriptNameMapPath: Record<string, string> = {
  jquery: path.resolve(__dirname, "../../node_modules/jquery/dist/jquery.min.js"),
}
export const launchOpt: LaunchOptions = {
  args: ["--start-maximized"],
  headless: false,
  executablePath: process.env.CHROME_EXECUTABLE_PATH,
}
