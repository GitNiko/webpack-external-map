require('dotenv').config()
const { Workspace } = require('../editor/io/index')
const RepoUrl = 'https://github.com/GitNiko/webpack-external-map'
const mapper = require('../storage/external.json')
;(async () => {
  const workSpace = new Workspace()
  await workSpace.init(RepoUrl)
  mapper['react-ok'] = { cc: 'tt' }
  mapper['react-dom']['>=16.2.0']['root'] = 'root'
  workSpace.save(JSON.stringify(mapper))
})()
