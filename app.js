/**
 * Module dependencies.
 */

var express = require('express'),
         io = require("socket.io"),
        irc = require("irc"),
      debug = false,
        app = module.exports = express.createServer();



// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
app.configure('development', function(){
  debug = true;
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var server  = "irc.freenode.net",
      nick  = debug?"blahblahblah":"jsFooBot",
   channel  = debug?"#jsfootest":"#hasgeek",
     names  = {},
     topic  = "",
  messages  = [],
   MAX_LOG  = 250;

// Routes
app.get('/', function(req, resp){
  resp.render('index', {
    'title': 'jsFoo 2011'
  });
});
app.get('/irc', function(req, resp){
  resp.render('irc', {
    'title': 'jsFoo 2011',
    'channel': channel,
    'server': server
  });
});

// Catch all route
app.use(function(eq, resp){
  resp.redirect("/");
});

// prevent server from starting as module - can be used with something like multinode
if (!module.parent) {
  app.listen(10551);
  console.info("Started on port %d", app.address().port);
}


// Bind Socket.IO server to the http server
var io = io.listen(app);
io.set('log level', debug?3:1);
io.sockets.on('connection', function(client){
  // Am i supposed to do something here ... ?? not sure yet
  // Send the Back-log
  io.sockets.emit('names', names);
  io.sockets.emit('topic', topic);
  io.sockets.emit('message', messages);
});

// Init the IRC client & connect to #hasgeek
var ircClient = new irc.Client(server, nick, {
  'channels'  : [channel],
  'userName'  : "jsFooBot",
  'realName'  : "jsFooBot",
  'password'  : null,
  'autoRejoin': true,
  'debug'     : debug
});

console.info("Connecting to freenode");

ircClient.addListener('names', function(ch, nicks){
  if(ch.toLowerCase() !== channel) return;
  names = nicks;
  io.sockets.emit('names', nicks);
});
ircClient.addListener('topic', function(ch, tp){
  if(ch.toLowerCase() !== channel) return;
  topic = tp;
  io.sockets.emit('topic', topic);
});
ircClient.addListener('join', function(ch, nick){
  if(ch.toLowerCase() !== channel) return;
  names[nick] = '';
  io.sockets.emit('join', nick);
});
ircClient.addListener('part', function(channel, nick){
  if(ch.toLowerCase() !== channel) return;
  delete names[nick];
  io.sockets.emit('part', nick);
});
ircClient.addListener('message', function (from, ch, text) {
  if(ch.toLowerCase() !== channel) return;
  var packet = {from: from, channel: channel, text: text, time: (new Date()).toUTCString()};
  messages.push(packet);
  if(messages.length > MAX_LOG) messages.shift();
  io.sockets.emit('message', packet);
});