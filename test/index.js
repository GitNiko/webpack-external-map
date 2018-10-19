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
const devServerOptions = Object.assign({}, webpackConfig.devServer, {
  stats: {
    colors: true,
  },
})
const server = new WebpackDevServer(compiler, devServerOptions)

server.listen(8080, '127.0.0.1', () => {
  console.log('Starting server on http://localhost:8080')
})
// const util = require('util')
// const lock = require('./package-lock-test.json')
// const getMap = require('../src/index')
// const myconf = ['moment', 'antd']

// const fakePackageJson = {
//   name: 'webpack-external-map',
//   version: '0.5.0',
//   description: 'a map of external configure',
//   main: 'index.js',
//   dependencies: {
//     antd: '^3.9.2',
//     axios: '^0.18.0',
//     classnames: '^2.2.5',
//     'file-saver': '^1.3.8',
//     history: '^4.7.2',
//     jquery: '^3.3.1',
//     'js-cookie': '^2.2.0',
//     lodash: '^4.17.11',
//     moment: '^2.22.2',
//     'moment-timezone': '^0.5.21',
//     'object-assign': '^4.1.1',
//     'prop-types': '^15.6.0',
//     qs: '^6.5.2',
//     react: '^16.2.0',
//     'react-dom': '^16.2.0',
//     'react-quill': '^1.3.1',
//     'react-redux': '^5.0.6',
//     'react-router-dom': '^4.2.2',
//     'react-router-redux': '^5.0.0-alpha.8',
//     redux: '^3.7.2',
//     'redux-saga': '^0.16.0',
//     'rrc-loader-helper': '^1.3.2',
//     sheinq: '^1.1.8',
//     shineout: '^1.0.9-rc-6',
//     wangeditor: '^3.1.1',
//     'whatwg-fetch': '^2.0.3',
//   },
// }

// console.log(util.inspect(getMap(myconf, lock)))
