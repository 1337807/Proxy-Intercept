var sys = require('sys'); 
var profiler =  require("v8-profiler");
var http = require('http');
var net = require('net');
var url = require('url');
var io = require('socket.io');
var express = require('express');
var proxy = require('./lib/proxy.js');
var clientTransport = require('./lib/clientTransporter.js');
var ipAddr = '127.0.0.1';
var port = 8080;

var app = express.createServer();
app.set('view engine', 'jade');
app.set('log level', 1);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.render('index.jade', { pageTitle: 'My Site' });
});
app.listen(80);

var socket = io.listen(app);
socket.set('log level', 1);
//for some reason webkit doesn't work with websockets in EC2....
socket.set('transports', ['xhr-polling']);

var transport = clientTransport.getInstance(socket);
var ProxyServer = proxy.createServer(transport);

var server = http.createServer(function(request, response) {

    
    var proxy_request = ProxyServer.createRequest(request);
    if (!proxy_request) {
        response.end();
        return;
    }

    proxy_request.on('error', function(er){
        response.end();
    });  


    proxy_request.on('response', function (proxy_response) {
 
        proxy_response.addListener('data', function(chunk) {
            response.write(chunk);
        });
     
        proxy_response.addListener('end', function() {
            response.end();
        });
         
        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    request.on('end', function() {
      proxy_request.end();
    });

});

server.listen(port);


['unhandledException', 'error'].forEach(function(eventName) {
    socket.on(eventName, function(e) {
        console.log('error on socket');
    });
});


sys.puts('Server running at http://'+ipAddr+':'+port+'/');

