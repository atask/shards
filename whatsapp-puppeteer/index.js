const puppeteer = require('puppeteer')

async function waitForWAConnection(client) {
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

async function waitForWADisconnection(client) {
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

const CHAT_MESSAGES_SELECTOR = '._1ays2 .FTBzM'
async function getCount(page) {
  return await page.$$eval(CHAT_MESSAGES_SELECTOR, a => a.length)
}

async function scrollUp(page) {
  await page.$eval(`${CHAT_MESSAGES_SELECTOR}:first-child`, e => {
    e.scrollIntoView();
  });
}

;(async () => {
  const browser = await puppeteer.launch({
    //args: [ '--proxy-pac-url=http://wpad.example.it/wpad.dat' ],
    headless: false,
    slowMo: 250
  })

  const page = await browser.newPage()
  await page.setViewport({
    width: 800,
    height: 3000
  })

  await page.goto(
    'https://web.whatsapp.com/',
    { waitUntil: [ 'load', 'networkidle0' ] }
  )

  // Thought this would help, but pageScaleFactor can only zoom in
  // const session = await page.target().createCDPSession();
  // await session.send('Emulation.setPageScaleFactor', {
  //   pageScaleFactor: 4,
  // });

  const rememberMeSelector = 'input[name="rememberMe"]'
  await page.waitForSelector(rememberMeSelector)
  await page.click(rememberMeSelector)

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  await waitForWAConnection(client)
  console.log('connected!')

  const CHAT_SELECTOR = '.X7YrQ'
  const CHAT_TITLE_SELECTOR = '._19RFN'
  let chatTitleEHs = await page.$$(CHAT_SELECTOR)
  // let chatTitleHtml = await Promise.all(chatTitleEHs.map(
  //   async titleHandle => await page.evaluate(title => title.outerHTML, titleHandle)
  // ));

  let chatTitleHtml = await Promise.all(chatTitleEHs.map(
    async titleHandle => await titleHandle.$eval(
      CHAT_TITLE_SELECTOR,
      node => node.getAttribute('title')
    )
  ));

  const DELAY = 3000;
  const MAX_NODES = 350;

  await chatTitleEHs[0].click()
  console.log("Clicked!")

  console.log("pre-waitFor - START")
  await page.waitFor(DELAY);
  console.log("pre-waitFor - END")
  
  let preCount = 0;
  let postCount = 0;
  do {
    preCount = await getCount(page);
    console.log("scrollUp - START")
    await scrollUp(page);
    console.log("scrollUp - START")
    console.log("waitFor - START")
    await page.waitFor(DELAY);
    console.log("waitFor - END")
    postCount = await getCount(page);
    console.log(`count [ pre: ${preCount}, post: ${postCount} ]`)
  } while (postCount > preCount && postCount < MAX_NODES);

  console.log("chatTitleHtml", chatTitleHtml)

  await waitForWADisconnection(client)
  console.log('disconnected!')
  
  await client.detach()
  await browser.close()
})().catch(e => {
  // Deal with the fact the chain failed
  console.error('ERROR!', e)
})
