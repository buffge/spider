import App from './app'

const app = new App()
try {
  app.start()
} catch (e) {
  console.log('运行过程发生了错误', e)
}
