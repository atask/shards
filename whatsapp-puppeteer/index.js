const puppeteer = require('puppeteer')

async function waitForWAConnection(page) {
  const client = page._client
  return new Promise(resolve => {
    client.on(
      'Network.webSocketFrameReceived',
      ({ requestId, timestamp, response }) => {
        if (response.payloadData.includes('"connected":true')) {
          resolve()
        }
      }
    )
  })
}

async function waitForWADisconnection(page) {
  const client = page._client
  return new Promise(resolve => {
    client.on(
      'Network.webSocketFrameReceived',
      ({ requestId, timestamp, response }) => {
        if (response.payloadData.includes('["Cmd",{"type":"disconnect"}]')) {
          resolve()
        }
      }
    )
  })
}

// const CHAT_SELECTOR = '.X7YrQ'
const CHAT_SELECTOR = 'body'
async function getChats(page) {
  return await page.$$eval(CHAT_SELECTOR, getChatDetails);
}

async function getChatDetails() {
  console.log('here')
}

;(async () => {
  const browser = await puppeteer.launch({
    //args: [ '--proxy-pac-url=http://wpad.example.it/wpad.dat' ],
    headless: false,
    slowMo: 250
  })

  const page = await browser.newPage()

  const client = page._client

  await page.goto(
    'https://web.whatsapp.com/',
    { waitUntil: [ 'load', 'networkidle0' ] }
  )

  const rememberMeSelector = 'input[name="rememberMe"]'
  await page.waitForSelector(rememberMeSelector)
  await page.click(rememberMeSelector)

  await waitForWAConnection(page)
  console.log('connected!')

  let chats = await getChats(page);

  await waitForWADisconnection(page)
  console.log('disconnected!')
  await browser.close()
})().catch(e => {
  // Deal with the fact the chain failed
  console.error('ERROR!', e)
})
