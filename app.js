/**
 * Module dependencies.
 */

var express = require('express'),
     stylus = require("stylus"),
      debug = false,
        app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(stylus.middleware({
    src: __dirname + '/src',
    dest: __dirname + '/static',
    compile: function (str, path, fn) {
      return stylus(str).set('filename', path).set('compress', true);//.use(require("nib")());
    }
  }));
  app.use(app.router);
});

app.configure('development', function(){
  debug = true;
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.static(__dirname + '/static'));
});
app.configure('production', function(){
  app.use(express.errorHandler());
  app.enable('view cache');
  app.use(require('connect-gzip').staticGzip(__dirname + '/static', { maxAge: 86400*365 }));
});

function capitalize(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Routes
var routeRegEx = /^\/201[12]\-(bangalore|pune|chennai)\/(about\-(event|hasgeek)|schedule|venue|hacknight|videos|sponsors|credits|register)?\/?$/;
app.get(routeRegEx, function(req, resp){
  var url = req.url;
  var params = url.match(/(2011|2012)\-(bangalore|pune|chennai)/);
  var year = params[1];
  var city = params[2];
  var opts = {
    title: ['jsFoo', capitalize(city), year].join(' '),
    path: [city, year].join('/')
  };
  resp.render('main', opts);
});

// Catch all route
app.use(function(eq, resp){
  resp.redirect("/2011-pune/");
});

// prevent server from starting as module - can be used with something like multinode/cluster
if (!module.parent) {
  app.listen(process.env.app_port || 11728);
  console.info("Started on port %d", app.address().port);
}

if(!debug){
 require('./ircClient').init(app, debug);
}

