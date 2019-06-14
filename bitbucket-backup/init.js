const dotenv = require('dotenv')
const shell = require('shelljs')
const EOL = require('os').EOL
const path = require('path')

const [ , , ...args ] = process.argv
dotenv.config()
const { workspace } = process.env
const cwd = process.cwd()

shell.cat(args[0])
  .split(EOL)
  .filter(repo => repo.length)
  .forEach(repo => {
    let [ url, project ] = repo.split(',')
    let [ , name ] = url.split('/')

    shell.echo(`Cloning from ${url}`)
    shell.echo('-------------------')
    shell.echo('')

    let projectFolder = path.join(cwd, `bitbucket-${workspace}`, `bitbucket-${workspace}-${project}`)
    let repoFolder = path.join(projectFolder, name)
    if (!shell.test('-d', repoFolder)) {
      if (!shell.test('-d', projectFolder)) {
        shell.mkdir('-p', projectFolder)
      }
      shell.cd(projectFolder)
      shell.exec(`git clone --progress git@bitbucket.org:${url}.git`)
    }
    shell.cd(repoFolder)
    let remoteBranches = shell.exec(`git branch -r`)
      .split(EOL)
      .filter(branch => branch.length)
    if (remoteBranches.length !== 0) {
      let headBranch = remoteBranches
        .find(branch => branch.includes('HEAD'))
        .split(' -> ')[1]
      let headBranchLocal = headBranch.split('/')[1]
      let targetBranches = remoteBranches
        .filter(branch => !branch.includes(headBranch))
        .map(branch => branch.trim())

      targetBranches.forEach(branch => {
          shell.exec(`git checkout --force --track ${branch}`)
        })

      shell.exec('git fetch --all --tags --prune')
      shell.exec(`git checkout --force ${headBranchLocal}`)
    } else {
      shell.echo('No remote branches to work with...')
    }
    shell.cd(cwd)

    shell.echo('')
  })
