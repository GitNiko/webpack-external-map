const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const WebpackExternalMap = require('./src/index')

const config = WebpackExternalMap(
  undefined,
  () => require('./test/package-test.json'),
  () => require('./test/package-lock-test.json'),
)('development', 'development')
console.log(config)
module.exports = {
  entry: './test/entry.js',
  // output: {
  //   path: __dirname + '/dist',
  //   filename: 'index_bundle.js',
  // },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'test',
      template: path.resolve(__dirname, './test/index.ejs'),
    }),
    new config.plugin(),
  ],
}
