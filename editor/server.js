require('dotenv').config()
const Koa = require('koa')
const next = require('next')
const Router = require('koa-router')
const koaBody = require('koa-body')
const proxy = require('./middlewares/proxy')
const { Workspace } = require('./io/index')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, dir: './editor' })
const handle = app.getRequestHandler()

const workspace = new Workspace()
workspace
  .init(process.env.REPO_URL)
  .then(ok => app.prepare())
  .then(() => {
    const server = new Koa()
    const router = new Router()

    server.use(proxy)
    server.use(koaBody())
    // router.get('/a', async ctx => {
    //   await app.render(ctx.req, ctx.res, '/b', ctx.query)
    //   ctx.respond = false
    // })

    // router.get('/b', async ctx => {
    //   await app.render(ctx.req, ctx.res, '/a', ctx.query)
    //   ctx.respond = false
    // })

    router.get('/api/mapping', async ctx => {
      try {
        const mapping = await workspace.getMapping()
        ctx.status = 200
        ctx.body = mapping
      } catch (e) {
        ctx.status = 500
        ctx.body = e.message
      }
    })

    router.post('/api/mapping/:package/:range', async ctx => {
      try {
        const mapping = await workspace.getMapping()
        const name = ctx.params.package
        const range = ctx.params.range
        if (mapping[name] === undefined) {
          mapping[name] = {}
        }
        mapping[name][range] = ctx.request.body
        await workspace.save(JSON.stringify(mapping))
        ctx.status = 200
        ctx.body = true
      } catch (e) {
        ctx.status = 500
        ctx.body = e.message
      }
    })

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
