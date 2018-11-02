const icyrip = require('./node_modules/icy-rip/lib/icy.js').main
const path = require('path')
const tunnel = require("tunnel")
const URL = require('url')

var tunnelingAgent = tunnel.httpOverHttp({
  proxy: { // Proxy settings
    host: 'proxy.com', // Defaults to 'localhost'
    port: 8080, // Defaults to 80
  }
})

var url = URL.parse('http://www.cvgm.net:8000/cvgm192')
//url.agent = tunnelingAgent

let outputFolder = path.join(process.cwd(), 'recordings')

icyrip({ url, outputFolder })
