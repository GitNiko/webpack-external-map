// next.config.js
// module.exports = {
//   /* config options here */
// }

// next.config.js
const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
// if (typeof require !== 'undefined') {
//   require.extensions['.css'] = file => {}
// }

module.exports = withLess(withCSS())
