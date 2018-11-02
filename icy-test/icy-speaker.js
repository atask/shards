var icy = require('icy');
var lame = require('lame');
var Speaker = require('speaker');
var tunnel = require("tunnel");
var URL = require('url');

var tunnelingAgent = tunnel.httpOverHttp({
  proxy: { // Proxy settings
    host: 'proxy.com', // Defaults to 'localhost'
    port: 8080, // Defaults to 80
  }
});

var url = URL.parse('http://www.cvgm.net:8000/cvgm192');
//url.agent = tunnelingAgent;

process.on('uncaughtException', function (err) {
    console.log("UE");
    console.log(err);
});

// connect to the remote stream
icy.get(url, function (res) {

  // log the HTTP response headers
  console.error(res.headers);

  // log any "metadata" events that happen
  res.on('metadata', function (metadata) {
    var parsed = icy.parse(metadata);
    console.error(parsed);
  });

  // Let's play the music (assuming MP3 data).
  // lame decodes and Speaker sends to speakers!
  res.pipe(new lame.Decoder())
     .pipe(new Speaker());
});
