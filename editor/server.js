require('dotenv').config()
const Koa = require('koa')
const next = require('next')
const Router = require('koa-router')
const proxy = require('./middlewares/proxy')
const { Workspace } = require('./io/index')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, dir: './editor' })
const handle = app.getRequestHandler()

const workspace = new Workspace()
workspace.init(process.env.REPO_URL)

app.prepare().then(() => {
  const server = new Koa()
  const router = new Router()

  server.use(proxy)
  // router.get('/a', async ctx => {
  //   await app.render(ctx.req, ctx.res, '/b', ctx.query)
  //   ctx.respond = false
  // })

  // router.get('/b', async ctx => {
  //   await app.render(ctx.req, ctx.res, '/a', ctx.query)
  //   ctx.respond = false
  // })

  router.get('/api/mapping', async ctx => {})

  router.post('/api/commit', async ctx => {})

  router.get('*', async ctx => {
    await handle(ctx.req, ctx.res)
    // ctx.respond = false
  })

  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })

  server.use(router.routes())
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
