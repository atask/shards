const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')

const dotenv = require('dotenv')
const fetch = require('node-fetch')
const tunnel = require('tunnel')
const debug = require('debug')('dump-songs')

const outDir = 'songs'
const waitTime = 1
const startPage = 101
const endPage = 850
const baseTimestamp = 20170606171705
const batchSize = 10
dotenv.load()
let fetchPage = null

// async function savePageMock (page, data) {
//   let fileName = `page-${page.toString().padStart(3, '0')}.html`
//   debug(`__MOCK: save page ${fileName}`)
//   await pause(1)
// }

// let fetchMockCounter = 0
// async function fetchPageMock (url) {
//   debug(`__MOCK: fetch get ${url}`)
//   // await pause(1)
//   let roll = Math.random()
//   let notFound = { status: 404 }
//   let good = { status: 200, text: () => Promise.resolve(`Nice page data: ${url}`) }
//   let moved = { status: 200, text: () => Promise.resolve(`found capture at ${(++fetchMockCounter).toString().padStart(14, '0')}`) }
//   if (roll < 0.333) {
//     debug(`__MOCK: fetch responding with 'not found'`)
//     return notFound
//   } else if (roll < 1) {
//     debug(`__MOCK: fetch responding with 'good'`)
//     return good
//   } else {
//     debug(`__MOCK: fetch responding with 'moved'`)
//     return moved
//   }
// }

async function findStartPage () {
  let outGoodList = await fsPromises.readdir(outDir)
  let outBadList = ''
  try {
    outBadList = await fsPromises.readFile(path.join(outDir, 'not-found.txt'), 'utf8')
  } catch (error) {}
  let lastGoodPage = outGoodList
    .filter(file => /page-\d{3}.html/.test(file))
    .map(pageFile => parseInt(pageFile.match(/\d{3}/)[0], 10))
    .sort()
    .pop() || 0
  let lastBadPage = outBadList
    .split('\n')
    .map(page => parseInt(page, 10))
    .filter(page => !isNaN(page))
    .pop() || 0
  let fileStartPage = lastGoodPage > lastBadPage
    ? lastGoodPage + 1
    : lastBadPage + 1
  return fileStartPage > startPage ? fileStartPage : startPage
}

function pause (seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

function getSongPageArchiveUrl (page = 1, timestamp = baseTimestamp) {
  return `http://web.archive.org/web/${timestamp}/https://www.scenemusic.net/demovibes/songs/?&p=${page}`
}

async function savePage (page, data) {
  let fileName = `page-${page.toString().padStart(3, '0')}.html`
  let filePath = path.join(outDir, fileName)
  await fsPromises.writeFile(filePath, data)
}

async function saveNotFoundPage (page) {
  await fsPromises.appendFile(path.join(outDir, 'not-found.txt'), `${page}\n`)
}

async function dumpSongPageArchive (page, timestamp) {
  debug(`Fetching page ${page} of ${endPage} (timestamp ${timestamp})`)
  // let response = await fetchPageMock(getSongPageArchiveUrl(page, timestamp))
  let response = await fetchPage(getSongPageArchiveUrl(page, timestamp))
  debug(`Pausing ${waitTime} seconds...`)
  await pause(waitTime)
  debug(`...done!`)
  let isNotFound = response.status === 404
  if (isNotFound) {
    debug(`Writing not found page ${page} to missing file`)
    await saveNotFoundPage(page)
  } else {
    let pageData = await response.text()
    if (pageData.includes('found capture at')) {
      let newTimestamp = pageData.match(/\d{14}/)[0]
      pageData = await dumpSongPageArchive(page, newTimestamp)
    } else {
      debug(`Writing page ${page} to file`)
      await savePage(page, pageData)
    }
  }
}

async function dumpSongBatch (startPage, endPage) {
  for (let page = startPage; page < endPage; page++) {
    await dumpSongPageArchive(page, baseTimestamp)
  }
}

function initFetchPage () {
  let fetchOptions = { compress: false }
  let proxy = {
    host: process.env.proxy_host,
    port: process.env.proxy_port
  }
  if (proxy.host) {
    let tunnelingAgent = tunnel.httpOverHttp({ proxy })
    fetchOptions.agent = tunnelingAgent
  }
  return url => fetch(url, fetchOptions)
}

async function dumpSongs () {
  let start = await findStartPage()
  while (start < endPage) {
    let batchEnd = start + batchSize < endPage + 1
      ? start + batchSize
      : endPage + 1
    debug(`Starting batch [${start}, ${batchEnd - 1}]`)
    await dumpSongBatch(start, batchEnd)
    start += batchSize
  }
}

fetchPage = initFetchPage()
dumpSongs()
