#!/usr/bin/env node

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const tunnel = require('tunnel')
const fetch = require('node-fetch')
const dotenv = require('dotenv')
const url = require('url')
const fsPromises = require('fs').promises
const EOL = require('os').EOL

dotenv.config()
const { proxy, user, password, workspace } = process.env

let agent = null
if (proxy) {
  let proxyUrl = url.parse(proxy)
  agent = tunnel.httpOverHttp({
    proxy: {
      host: proxyUrl.hostname,
      port: proxyUrl.port
    }
  })
}

const auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')

async function fetchPage (url) {
  console.log(`Fetching page: ${url}`)
  let page = await fetch(
    url,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': auth
      },
      compress: false,
      agent
    }
  )
  if (page.ok) {
    console.log(`${url} -> OK`)
    return page.json()
  }
  console.log(`${url} -> ERROR`)
  throw new Error(page.statusText)
}

function parsePage (repos, page) {
  page.values.forEach(repo => {
    let fullName = repo.full_name
    let project = repo.project != null
      ? repo.project.key
      : 'NONE'
    if (repos[project] == null) {
      repos[project] = [ fullName ]
    } else {
      repos[project].push(fullName)
    }
  })
}

async function getProjects () {
  const firstPageUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}`
  let projects = {}
  let currentUrl = firstPageUrl
  let nextPage = null
  do {
    let currentPage = await fetchPage(currentUrl)
    parsePage(projects, currentPage)
    currentUrl = currentPage.next
  } while (currentUrl != null)

  for (const [project, repos] of Object.entries(projects)) {
    let projectName = project.toLowerCase()
    
    let projFileName = `repos-${projectName}.txt`
    console.log(`Writing ${projFileName}`)
    
    let workFileName = `${workspace}-init-all.sh`
    console.log(`Appending ${workFileName}`)
    
    await fsPromises.writeFile(
      projFileName,
      repos
        .map(repo => `${repo},${projectName}`)
        .join(EOL)
        .concat(EOL)
    )
    
    await fsPromises.appendFile(
      workFileName,
      `node init.js ${projFileName} 2>&1 | tee log-${projectName}.md`
    )
  }
}

getProjects()
