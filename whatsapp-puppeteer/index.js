const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({
    args: [ '--proxy-pac-url=http://wpad.reply.it/wpad.dat' ],
    headless: false,
    slowMo: 250
  })

  const page = await browser.newPage()

  const client = page._client

  // client.on('Network.webSocketCreated', ({ requestId, url }) => {
  //   console.log('Network.webSocketCreated', requestId, url)
  // })

  // client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
  //   console.log('Network.webSocketClosed', requestId, timestamp)
  // })

  // client.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
  //   console.log('Network.webSocketFrameSent', requestId, timestamp, response.payloadData)
  // })

  client.on('Network.webSocketFrameReceived', async ({ requestId, timestamp, response }) => {
    // console.log('Network.webSocketFrameReceived', requestId, timestamp, response.payloadData)

    if (response.payloadData.includes('"connected":true')) {
      console.log('connected!')
    }

    if (response.payloadData.includes('["Cmd",{"type":"disconnect"}]')) {
      console.log('disconnected!')
      await browser.close()
    }
  })

  await page.goto(
    'https://web.whatsapp.com/',
    { waitUntil: [ 'load', 'networkidle0' ] }
  )

  const rememberMeSelector = 'input[name="rememberMe"]'
  await page.waitForSelector(rememberMeSelector)
  await page.click(rememberMeSelector)
})().catch(e => {
  // Deal with the fact the chain failed
})
