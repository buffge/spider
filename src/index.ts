import App from "#sites/sina/index.js"

const app = new App()
try {
  await app.start()
} catch (e) {
  console.error("运行过程发生了错误", e)
}
