require('dotenv').config()
const { Workspace } = require('../editor/io/index')
const RepoUrl = 'https://github.com/GitNiko/webpack-external-map'
const mapper = require('../storage/external.json')
// todo: remove side effect
it(
  'commits and pushs',
  async () => {
    const workSpace = new Workspace()
    await workSpace.init(RepoUrl)
    mapper['react-ok'] = { cc: 'tt' }
    mapper['react-dom']['>=16.2.0']['root'] = 'root'
    await workSpace.save(JSON.stringify(mapper))

    const mapping = await workSpace.getMapping()
    expect(mapping).toEqual(mapper)
  },
  20000,
)
