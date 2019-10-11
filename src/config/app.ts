import * as path from "path"
import { LaunchOptions } from "puppeteer"
export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36"
export const screenShotDir: string = path.resolve(__dirname, "../../runtime/screenshot")
export const scriptNameMapPath: Record<string, string> = {
  jquery: path.resolve(__dirname, "../../node_modules/jquery/dist/jquery.min.js"),
}
export const pseudoChrome = {
  app: { isInstalled: false },
  runtime: {
    PlatformOs: {
      MAC: "mac",
      WIN: "win",
      ANDROID: "android",
      CROS: "cros",
      LINUX: "linux",
      OPENBSD: "openbsd",
    },
    PlatformArch: {
      ARM: "arm",
      X86_32: "x86-32",
      X86_64: "x86-64",
      MIPS: "mips",
      MIPS64: "mips64",
    },
    PlatformNaclArch: {
      ARM: "arm",
      X86_32: "x86-32",
      X86_64: "x86-64",
      MIPS: "mips",
      MIPS64: "mips64",
    },
    RequestUpdateCheckStatus: {
      THROTTLED: "throttled",
      NO_UPDATE: "no_update",
      UPDATE_AVAILABLE: "update_available",
    },
    OnInstalledReason: {
      INSTALL: "install",
      UPDATE: "update",
      CHROME_UPDATE: "chrome_update",
      SHARED_MODULE_UPDATE: "shared_module_update",
    },
    OnRestartRequiredReason: {
      APP_UPDATE: "app_update",
      OS_UPDATE: "os_update",
      PERIODIC: "periodic",
    },
  },
}
export const launchOpt: LaunchOptions = {
  args: [
    "--start-maximized",
    "--no-sandbox",
    "--disable-infobars",
    "--lang=zh-CN",
    "--disable-dev-shm-usage",
    // "--disable-gpu",
  ],

  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE_PATH,
}
export const rtPath = path.resolve(__dirname, "../../../runtime")
export const screenShotPath = rtPath + "/screenshot"
