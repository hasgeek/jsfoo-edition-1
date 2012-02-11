/**
 * Module dependencies.
 */

var express = require('express'),
     stylus = require("stylus"),
        app = module.exports = express.createServer(),
 routeRegEx = /^\/(bangalore|pune|chennai)201[12](\/(about\-(event|hasgeek)|schedule|venue|hacknight|videos|sponsors|credits|register))?\/?$/;

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(stylus.middleware({
    src: __dirname + '/src',
    dest: __dirname + '/static',
    compile: function (str, path, fn) {
      return stylus(str).set('filename', path).set('compress', true);
    }
  }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express["static"](__dirname + '/static'));
});

app.configure('production', function(){
  app.use(express.errorHandler({ dumpExceptions: false, showStack: false }));
  app.enable('view cache');

  // Use gzippo to compress all text content
  app.use(require("gzippo").staticGzip(__dirname + '/static', {
    maxAge: 86400*365
  }));
});

// Add a logger after the static handler, but before the router
app.configure(function(){
  app.use(express.logger({
    format: ":date - :remote-addr - :method - :url - :user-agent"
  }));
  app.use(app.router);
});

function capitalize(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

var eventData = {
  "bangalore2011": {
    doAttendId: 4417,
    time: "October 1, 2011",
    city: "Bangalore",
    scheduleFinalized: true
  },
  "pune2012": {
    doAttendId: 19398,
    time: "January 21, 2012",
    city: "Pune",
    scheduleFinalized: true
  },
  "chennai2012": {
    doAttendId: 19808,
    time: "February 18, 2012",
    city: "Chennai",
    scheduleFinalized: true
  }
};

// Routes

app.all(/\/[45]0[0-9]\/?/, function(req, resp){
  var errorCode = parseInt(req.url.replace(/[^0-9]/, ""), 10);
  // TODO: find out how to send headers without breaking the resp.render
  // resp.writeHead(errorCode);
  resp.render("error", {
    title: errorCode,
    layout: false
  });
  resp.end();
});

app.error(function(err, req, resp, next) {
  resp.redirect("/403");
});

app.get(routeRegEx, function(req, resp){
  var url = req.url;
  var params = url.match(/(bangalore|pune|chennai)(201[12])/);
  var year = params[2];
  var city = params[1];
  var opts = [city, year];
  var data = eventData[params[0]];
  if(typeof data !== 'undefined') {
    resp.render('main', {
      title: ['JSFoo', capitalize(city), year].join(' '),
      prefix: opts.join(''),
      path: opts.join('/'),
      eventData: data
    });
  } else {
    resp.redirect("/403");
  }
});

// Catch all route
app.use(function(eq, resp){
  resp.redirect("/chennai2012/");
});

// prevent server from starting as module - can be used with something like multinode/cluster
if (!module.parent) {
  app.listen(process.env.app_port || 11728);
  console.info("Started on port %d", app.address().port);
}
