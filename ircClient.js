var server = "irc.freenode.net",
    debug = false, io,
    channel, nick, names = {}, topic = "", messages = [],
    MAX_LOG = 400;
   
exports.init = function(app, _debug) {
  debug = _debug;
  channel = debug ? "#jsfootest" : "#hasgeek";
  nick = debug ? "blahblahblah" : "JSFooBot";

  app.get('/irc', function(req, resp){
    resp.render('irc', {
      'title': 'JSFoo 2011',
      'channel': channel,
      'server': server
    });
  });

  initSocketIO(app);

  initBacklogger();

  initIRCClient();
};

function initSocketIO(app) {
  // Bind Socket.IO server to the http server
  io = require("socket.io").listen(app);

  
  io.configure('production', function(){
    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'htmlfile', 'flashsocket']);
  });

  io.configure('development', function(){
    io.set('log level', 2);
    io.set('transports', ['websocket', 'xhr-polling']);
  });

  io.sockets.on('connection', function(client){
    // Send the Back-log
    io.sockets.emit('names', names);
    io.sockets.emit('topic', topic);
    io.sockets.emit('message', messages);
  });
}

function initBacklogger (){
  var connection = require('couch-client')("http://jsfoobot:foobotpass@netroy.iriscouch.com/irc_jsfoo"),
      docId = "backlog";

  // Before initializing IRC client, pull the json from couchDB
  console.info("fetching back log");
  connection.get(docId, function(err, doc){
    if(err){
      console.error(err);
      return;
    }else if(doc.messages && doc.messages.length){
      messages = doc.messages;
      console.log("Fetched the backlog. Message count : " + messages.length);
    }
  });

  // And set a timer to take backups every 60 seconds
  var lastTimeStamp = 0, last;
  if(!debug) setInterval(function(){
    if(messages.length === 0) return;
    last = messages[messages.length - 1];
    if(last.time <= lastTimeStamp) return;
    try{
      connection.save({
        "_id": docId,
        "messages": messages
      }, function(err, doc){
        if(err){
          console.error("Saving failed");
          console.error(err);
          return;
        }
        lastTimeStamp = last.time;
        console.info("Saved the backlog at " + new Date(lastTimeStamp));
      });
    }catch(e){}
  },60*1000);

  // And on SIGHUP flush the backlog
  process.on('SIGHUP', function () {
    messages = [];
    lastTimeStamp = (new Date()).getTime();
    console.log("SIGHUP recieved.. flushing IRC message backlog");
  });

}

function initIRCClient() {

  // Init the IRC client & connect to #hasgeek
  var ircClient = new (require("irc")).Client(server, nick, {
    'channels'  : [channel],
    'userName'  : nick,
    'realName'  : nick,
    'password'  : null,
    'autoRejoin': true,
    'debug'     : debug
  });

  console.info("Connecting to freenode");

  // Add message handlers to the IRC client
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
  ircClient.addListener('part', function(ch, nick){
    if(ch.toLowerCase() !== channel) return;
    delete names[nick];
    io.sockets.emit('part', nick);
  });
  ircClient.addListener('nick', function(old, nick){
    delete names[old];  
    names[nick] = '';
    io.sockets.emit('nick', old, nick);
  });
  ircClient.addListener('message', function (from, ch, text) {
    if(ch.toLowerCase() !== channel) return;
    var packet = {from: from, text: text, time: (new Date()).getTime()};
    messages.push(packet);
    if(messages.length > MAX_LOG) messages.shift();
    io.sockets.emit('message', packet);
  });

}

