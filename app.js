/**
 * Module dependencies.
 */

var express = require('express'),
     stylus = require("stylus"),
        app = module.exports = express.createServer(),
 routeRegEx = /^\/(bangalore|pune|chennai)\-201[12]\/(about\-(event|hasgeek)|schedule|venue|hacknight|videos|sponsors|credits|register)?\/?$/;

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
      //.use(require("nib")());
    }
  }));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
  app.enable('view cache');

  // Use gzippo to compress all text content
  app.use(require("gzippo").staticGzip(__dirname + '/static', {
    maxAge: 86400*365
  }));
});

function capitalize(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

var eventData = {
  "bangalore-2011": {
    doAttendId: 4417,
    time: "October 1, 2011",
    city: "Bangalore"
  },
  "pune-2012": {
    doAttendId: 19398,
    time: "January 21, 2012",
    city: "Pune"
  },
  "chennai-2012": {
    doAttendId: 0,
    time: "February 18, 2012",
    city: "Chennai"
  }
};

// Routes
app.get(routeRegEx, function(req, resp){
  var url = req.url;
  var params = url.match(/(bangalore|pune|chennai)\-(201[12])/);
  var year = params[2];
  var city = params[1];
  var opts = [city, year];
  resp.render('main', {
    title: ['JSFoo', capitalize(city), year].join(' '),
    prefix: opts.join('-'),
    path: opts.join('/'),
    eventData: eventData[params[0]]
  });
});

// Catch all route
app.use(function(eq, resp){
  resp.redirect("/pune-2012/");
});

// prevent server from starting as module - can be used with something like multinode/cluster
if (!module.parent) {
  app.listen(process.env.app_port || 11728);
  console.info("Started on port %d", app.address().port);
}
