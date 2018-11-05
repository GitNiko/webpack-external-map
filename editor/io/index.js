const fs = require('fs')
const path = require('path')
const Git = require('nodegit')

let workspaceDir = `${process.cwd()}/.workspace`
const RepoDir = workspaceDir
const FileName = 'external.json'
const FilePath = `storage/${FileName}`
const FullFilePath = `${RepoDir}/${FilePath}`

class Workspace {
  async init(url, option) {
    if (option && option.workspaceDir) {
      workspaceDir = option.workspaceDir
    }
    if (!fs.existsSync(workspaceDir)) {
      // makdir and clone
      fs.mkdir(workspaceDir)
      this.repo = await Git.Clone(url, workspaceDir)
    } else {
      // exist and fetch
      this.repo = await Git.Repository.open(RepoDir)
      await this.repo.fetch('origin')
      await this.repo.mergeBranches('master', 'origin/master')
    }
  }

  async save(content) {
    // fetch before change
    await this.repo.fetch('origin')
    await this.repo.mergeBranches('master', 'origin/master')

    fs.writeFileSync(FullFilePath, content, 'utf-8')
    const index = await this.repo.refreshIndex()
    await index.addByPath(FilePath)
    await index.write()
    const oid = await index.writeTree()
    const head = Git.Reference.nameToId(this.repo, 'HEAD')
    const parent = this.repo.getCommit(head)
    // git commit
    const author = Git.Signature.create(
      'GitNiko',
      'galaxis.ling@gmail.com',
      123456789,
      60,
    )
    const commiter = Git.Signature.create(
      'GitNiko',
      'galaxis.ling@gmail.com',
      987654321,
      90,
    )
    const commit = this.repo.createCommit(
      'HEAD',
      author,
      commiter,
      'commit external data',
      oid,
      [parent],
    )
    // todo: git push
  }
}

// async function Workspace(url, option) {
//   if (option && option.workspaceDir) {
//     workspaceDir = option.workspaceDir
//   }
//   if (!fs.existsSync(workspaceDir)) {
//     fs.mkdir(workspaceDir)
//   }

//   if (fs.existsSync(RepoDir)) {
//     // exist and fetch
//     this.repo = await Git.Repository.open(RepoDir)
//     await this.repo.fetch(url)
//   } else {
//     //
//     this.repo = await Git.Clone(url, workspaceDir)
//   }
// }
// Workspace.prototype.fuck = function() {}

// Workspace.prototype.save = async function(content) {
//   // git add
//   fs.writeFileSync(FullFilePath, content, 'utf-8')
//   const index = await this.repo.refreshIndex()
//   await index.addByPath(FilePath)
//   await index.write()
//   const oid = await index.writeTree()
//   const head = Git.Reference.nameToId(this.repo, 'HEAD')
//   const parent = this.repo.getCommit(head)
//   // git commit
//   const author = Git.Signature.create(
//     'GitNiko',
//     'galaxis.ling@gmail.com',
//     123456789,
//     60,
//   )
//   const commiter = Git.Signature.create(
//     'GitNiko',
//     'galaxis.ling@gmail.com',
//     987654321,
//     90,
//   )
//   const commit = this.repo.createCommit(
//     'HEAD',
//     author,
//     commiter,
//     'commit external data',
//     oid,
//     [parent],
//   )
//   // todo: git push
// }
// exports.createWrokspace = async function() {
//   return new Workspace(arguments)
// }
exports.Workspace = Workspace
