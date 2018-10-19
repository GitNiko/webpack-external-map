const db = require('./external.json')
const semver = require('semver')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const defaultLoadPackageJson = () => require(`${process.cwd()}/package.json`)
const defaultLoadPackageLock = () =>
  require(`${process.cwd()}/package-lock.json`)
const defaultLoadExternalMap = () => db
const calcUrl = (host, name, version) => path =>
  `${host}${name}@${version}/${path}`
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
      // set external config for webpack external with global variable
      acc.external[depName] = targetVersionPack.root
      acc.js = acc.js.concat(
        targetVersionPack.js[jsEnvName].map(
          calcUrl(unpkghost, depName, lockVersion),
        ),
      )

      acc.css = acc.css.concat(
        targetVersionPack.css
          ? targetVersionPack.css[cssEnvName].map(
              calcUrl(unpkghost, depName, lockVersion),
            )
          : [],
      )
      return acc
    },
    { external: {}, js: [], css: [] },
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
            data.assets.js = externalConfigInfo.js.concat(data.assets.js)
            data.assets.css = externalConfigInfo.css.concat(data.assets.css)
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
