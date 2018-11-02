var icy = require('icy');
var tunnel = require("tunnel");
var URL = require('url');

var tunnelingAgent = tunnel.httpOverHttp({
  proxy: { // Proxy settings
    host: 'proxy.com', // Defaults to 'localhost'
    port: 8080, // Defaults to 80
  }
});

var url = URL.parse('http://www.cvgm.net:8000/cvgm192');
url.agent = tunnelingAgent;

process.on('uncaughtException', function (err) {
    console.log("UE");
    console.log(err);
});

icy.get(url, function(res){

    res
      .resume()
      .on("metadata", function(metadata){
        var parsed = icy.parse(metadata);
        console.log(parsed);
      });

    /*
    res.on("error", err => {
      console.log(err)
    })
    res.on("close", data => {
      //console.log("close")
    })
    res.on("readable", data => {
      var buf = res.read()
      //console.log("readable")
    })
    res.on("end", data => {
      //console.log("end")
    })
    res.on("data", data => {
      //console.log("data")
    })
    */
});
