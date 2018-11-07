const axios = require('axios')
const URL = require('url')
const Unpkg = 'https://unpkg.com'
const Registry = 'https://registry.npmjs.org'

const ProxyList = [Registry]

const ajax = (url, params, data, method = 'GET', token, timeout = 10000) => {
  const proxyUrl = URL.parse(url)
  const isProxy = ProxyList.find(
    e => e === `${proxyUrl.protocol}//${proxyUrl.host}`,
  )
  let headers = {
    Accept: '*/*',
    'x-auth-token': token,
  }
  if (isProxy) {
    headers['x-need-proxy'] = proxyUrl.href
  }
  return axios
    .request({
      url: isProxy ? `${proxyUrl.pathname}/${proxyUrl.search || ''}` : url,
      method,
      data,
      params,
      headers,
      timeout,
    })
    .then(res => res.data)
}
module.exports = {
  getExternMapJson: () => {
    return ajax(`/api/mapping`)
  },
  getPackageInfo: (pkg = 'rct-form') => {
    return ajax(`${Registry}/${pkg}`)
  },
  searchPackage: name => {
    return ajax(`${Registry}/-/v1/search`, { text: name })
  },
  commit: mapping => {
    // return ajax('/api/mapping', {
    //   body: JSON.stringify(mapping),
    //   method: 'POST',
    // })
    return ajax('/api/mapping', null, mapping, 'POST', null, 20000)
  },
}
