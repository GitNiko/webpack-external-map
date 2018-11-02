const https = require('https')
const { promisify } = require('util')

const NeedProxy = 'x-need-proxy'

https.get[promisify.custom] = function getAsync(options) {
  return new Promise((resolve, reject) => {
    https
      .get(options, response => {
        response.end = new Promise(resolve => response.on('end', resolve))
        resolve(response)
      })
      .on('error', reject)
  })
}

const get = promisify(https.get)
async function proxy(ctx, next) {
  if (ctx.header[NeedProxy]) {
    //
    console.log('enter proxy')
    const proxyHref = ctx.header[NeedProxy]
    const res = await get(proxyHref)
    let body = ''
    res.on('data', chunk => (body += chunk))
    res.on('error', err => console.log(err))
    await res.end
    ctx.status = 200
    Object.keys(res.headers).forEach(key => ctx.set(key, res.headers[key]))
    ctx.body = body
  } else {
    await next()
  }
}

module.exports = proxy
