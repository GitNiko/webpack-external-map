const db = require('../storage/external.json')
const semver = require('semver')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const defaultLoadPackageJson = () => require(`${process.cwd()}/package.json`)
const defaultLoadPackageLock = () =>
  require(`${process.cwd()}/package-lock.json`)
const defaultLoadExternalMap = () => db
const calcUrl = (host, name, version) => path =>
  `${host}${name}@${version}/${path}`

// a:{b,c,},
// b:{},
// d:{e,f}
const toposort = depGraph => {
  let order = []
  const reduceGrap = (graph, order) => {
    // let subGraph = Object.keys(graph)
    //   .filter(name => {
    //     return Object.keys(graph[name]).length < 1
    //   })
    //   .reduce((subGraph, name) => {
    //     order.push(name)
    //     // remove vertices
    //     delete subGraph[name]
    //     // remove edges
    //     console.log(Object.keys(subGraph))
    //     Object.keys(subGraph).reduce((_, remainingVertexName) => {
    //       // remove relation edge
    //       if (subGraph[remainingVertexName][name]) {
    //         delete subGraph[remainingVertexName][name]
    //       }
    //     }, '')
    //     return subGraph
    //   }, graph)
    // if (Array.isArray(subGraph)) {
    //   return
    // } else {
    //   reduceGrap(subGraph, order)
    // }
    Object.keys(graph).forEach(name => {
      if (Object.keys(graph[name]).length < 1) {
        // not entry, can be remove
        order.push(name)
        // remove vertices and edge
        delete graph[name]
        Object.keys(graph).forEach(remainingVertexName => {
          if (graph[remainingVertexName][name]) {
            delete graph[remainingVertexName][name]
          }
        })
      } else {
        return
      }
    })
    if (Object.keys(graph).length > 0) {
      reduceGrap(graph, order)
    }
  }
  reduceGrap(depGraph, order)
  return order
}

const init = (
  unpkghost = 'https://unpkg.com/',
  loadPackageJson = defaultLoadPackageJson,
  loadPackageLock = defaultLoadPackageLock,
  loadExternalMap = defaultLoadExternalMap,
) => (jsEnvName, cssEnvName) => {
  const package = loadPackageJson()
  const lock = loadPackageLock()
  const externalMap = loadExternalMap()
  if (package.dependencies === undefined) throw new Error('no dependceis')
  const externalConfigInfo = Object.keys(package.dependencies).reduce(
    (acc, depName) => {
      const targetPack = externalMap[depName]
      if (!!targetPack === false) {
        // not exsits, skip
        console.debug(`ignore:${depName}`)
        return acc
      }
      const lockVersion = lock.dependencies[depName].version
      const matchedVersions = Object.keys(targetPack).filter(range =>
        semver.satisfies(lockVersion, range),
      )
      if (matchedVersions.length < 1) {
        // not match version, skip
        console.warn(`not match version: ${depName}, ${lockVersion}`)
        return acc
      }
      // the default is use the first version of matched
      const targetVersionPack = targetPack[matchedVersions[0]]
      acc.packages[depName] = targetVersionPack
      acc.packages[depName].lockVersion = lockVersion
      // set external config for webpack external with global variable
      acc.external[depName] = targetVersionPack.root
      // add vertices(package name) and edge(peer dependencies)
      acc.depGraph[depName] = targetVersionPack.peerDependencies || {}
      return acc
    },
    { packages: {}, external: {}, depGraph: {} },
  )

  const depOrder = toposort(externalConfigInfo.depGraph)
  console.log('depOrder', depOrder)
  // generate js and css orderly
  const source = depOrder.reduce(
    (acc, name) => {
      const targetVersionPack = externalConfigInfo.packages[name]
      acc.js = acc.js.concat(
        targetVersionPack.js[jsEnvName].map(
          calcUrl(unpkghost, name, targetVersionPack.lockVersion),
        ),
      )
      acc.css = acc.css.concat(
        targetVersionPack.css
          ? targetVersionPack.css[cssEnvName].map(
              calcUrl(unpkghost, name, targetVersionPack.lockVersion),
            )
          : [],
      )
      return acc
    },
    { js: [], css: [] },
  )

  class Plugin {
    apply(compiler) {
      compiler.hooks.compilation.tap('webpack-external-map', compilation => {
        console.log('The compiler is starting a new compilation...')

        // Staic Plugin interface |compilation |HOOK NAME | register listener
        HtmlWebpackPlugin.getHooks(
          compilation,
        ).beforeAssetTagGeneration.tapAsync(
          'webpack-external-map', // <-- Set a meaningful name here for stacktraces
          (data, cb) => {
            data.assets.js = source.js.concat(data.assets.js)
            data.assets.css = source.css.concat(data.assets.css)
            cb(null, data)
          },
        )
      })
    }
  }

  return {
    external: externalConfigInfo.external,
    plugin: Plugin,
  }
}

module.exports = init
