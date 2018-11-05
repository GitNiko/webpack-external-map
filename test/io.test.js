const { Workspace } = require('../editor/io/index')
const RepoUrl = 'https://github.com/GitNiko/webpack-external-map'
;(async () => {
  const workSpace = new Workspace()
  await workSpace.init(RepoUrl)
})()
