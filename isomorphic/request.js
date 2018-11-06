const unfetch = require('isomorphic-unfetch')
const URL = require('url')
const Unpkg = 'https://unpkg.com'
const Registry = 'https://registry.npmjs.org'

// fetch('/bear', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify({ hungry: true })
// }).then( r => {
//   open(r.headers.get('location'));
//   return r.json();
// })

// const headers = {
//   'Content-Type': 'application/json'
// }
const fetch = (url, options) => {
  const isProxy = process.title === 'browser'
  const proxyUrl = URL.parse(url)
  return unfetch(
    isProxy ? `${proxyUrl.pathname}/${proxyUrl.search || ''}` : url,
    isProxy
      ? {
          headers: { 'x-need-proxy': proxyUrl.href },
        }

      : options,
  )
}
// export const getExternMapJson = () => {
//   return fetch(`${unpkg}/react/package.json`).then(r => r.json)
// }
const externMapJson = require('../src/external.json')
module.exports = {
  getExternMapJson: () => {
    // return fetch(`${Unpkg}/react/package.json`).then(r => r.json())
    // fake
    return new Promise((resolve, reject) => resolve(externMapJson))
  },
  getPackageInfo: (package = 'rct-form') => {
    return fetch(`${Registry}/${package}`).then(r => r.json())
  },
  getMapping: () => {
    return fetch(`/api/mapping`).then(r => r.json)
  },
  commit: (mapping) => {
    return fetch('/api/mapping', {
      body: JSON.stringify(mapping),
      method: 'POST'
    })
  }
}
