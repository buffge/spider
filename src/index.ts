import "module-alias/register"
import App from "@sites/sina"
let app = new App()
try {
  app.start()
} catch (e) {
  console.log("运行过程发生了错误")
  console.log(e)
}
