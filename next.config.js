// next.config.js
// module.exports = {
//   /* config options here */
// }
require('dotenv').config()
// next.config.js
const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
// if (typeof require !== 'undefined') {
//   require.extensions['.css'] = file => {}
// }

module.exports = withLess(
  withCSS({
    publicRuntimeConfig: {
      // Will be available on both server and client
      staticFolder: '/static',
      mySecret: process.env.MY_SECRET, // Pass through env variables
    },
  }),
)
