const fs = require('fs')
const path = require('path')
const Util = require('util')
const Git = require('nodegit')

const readFile = Util.promisify(fs.readFile)

let workspaceDir = `${process.cwd()}/.workspace`
const RepoDir = workspaceDir
const FileName = 'external.json'
const FilePath = `storage/${FileName}`
const FullFilePath = `${RepoDir}/${FilePath}`

class Workspace {
  async init(url, option) {
    this.repoUrl = url
    if (option && option.workspaceDir) {
      workspaceDir = option.workspaceDir
    }
    if (!fs.existsSync(workspaceDir)) {
      // makdir and clone
      fs.mkdirSync(workspaceDir)
      this.repo = await Git.Clone(url, workspaceDir)
    } else {
      // exist and fetch
      this.repo = await Git.Repository.open(RepoDir)
      await this.repo.fetch('origin')
      await this.repo.mergeBranches('master', 'origin/master')
    }
  }

  async fetch() {
    // fetch before change
    await this.repo.fetch('origin')
    await this.repo.mergeBranches('master', 'origin/master')
  }

  async getMapping() {
    await this.fetch()
    const data = await readFile(FullFilePath)
    return JSON.parse(data)
  }

  async save(content) {
    await this.fetch()

    fs.writeFileSync(FullFilePath, content, 'utf-8')
    const index = await this.repo.refreshIndex()
    await index.addByPath(FilePath)
    await index.write()
    const oid = await index.writeTree()
    const head = await Git.Reference.nameToId(this.repo, 'HEAD')
    const parent = await this.repo.getCommit(head)
    // git commit
    const author = Git.Signature.now('GitNiko', 'galaxis.ling@gmail.com')
    const commiter = Git.Signature.now('GitNiko', 'galaxis.ling@gmail.com')
    const commit = this.repo.createCommit(
      'HEAD',
      author,
      commiter,
      'commit external data',
      oid,
      [parent],
    )
    // todo: git push
    const remote = await this.repo.getRemote('origin')
    try {
      await remote.push(['refs/heads/master:refs/heads/master'], {
        callbacks: {
          credentials: (url, userName) =>
            Git.Cred.userpassPlaintextNew(
              process.env.GIT_ACCOUNT,
              process.env.GIT_PASSWORD,
            ),
          // Git.Cred.sshKeyNew(
          //   'GitNiko',
          //   '6f3ea1686b718c612ea3c4b078e777ae46fd3ade',
          // ),
          certificateCheck: function() {
            return 1
          },
        },
      })
    } catch (e) {
      console.log(e)
    }
    return true
  }
}
exports.Workspace = Workspace
