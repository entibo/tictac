const WebSocket = require('ws');

console.log("Hi!")

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send(message)
  });

  ws.send('something');
});

wss.on('error', function(e) { console.log(e) })
wss.on('listening', function() { console.log("listening") })