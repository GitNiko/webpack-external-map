// const puppeteer = require('puppeteer-core')
// // get http://localhost:9222/json/version json
// ;(async () => {
//   try {
//     const browser = await puppeteer.connect({
//       browserWSEndpoint:
//         'ws://127.0.0.1:9222/devtools/browser/beade698-4733-436b-b69d-eadbba1db284',
//     })

//     const page = await browser.newPage()
//     await page.goto('https://example.com')
//     //
//     // await browser.close()
//   } catch (e) {
//     console.log(e)
//   }
// })()
const Webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackConfig = require('../webpack.config')

const compiler = Webpack(webpackConfig)
// const devServerOptions = Object.assign({}, webpackConfig.devServer, {
//   stats: {
//     colors: true,
//   },
// })
// const server = new WebpackDevServer(compiler, devServerOptions)

// server.listen(8080, '127.0.0.1', () => {
//   console.log('Starting server on http://localhost:8080')
// })

compiler.run((err, stats) => {
  console.log(stats)
})
