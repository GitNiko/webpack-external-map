import axios from 'axios'
import URL from 'url'
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
export const getExternMapJson = () => {
  return ajax(`/api/mapping`)
}
export const getPackageInfo = (pkg = 'rct-form') => {
  return ajax(`${Registry}/${pkg}`)
}
export const searchPackage = name => {
  return ajax(`${Registry}/-/v1/search`, { text: name, size: 100 })
}
export const getPackageMeta = (pkg = 'rct-form', version) => {
  return ajax(`${Unpkg}/${pkg}@${version}?meta`)
}
export const getPackageMetaList = (type = 'file') => (...args) => {
  const fold = (meta, result) => {
    result.push(meta)
    if (meta.type === 'directory' && meta.files.length) {
      for (let i in meta.files) {
        fold(i, result)
      }
    }
    return
  }
  return getPackageMeta(...args).then(meta => {
    let list = []
    fold(meta, list)
    return list
  })
}
export const commit = mapping => {
  // return ajax('/api/mapping', {
  //   body: JSON.stringify(mapping),
  //   method: 'POST',
  // })
  return ajax('/api/mapping', null, mapping, 'POST', null, 20000)
}
