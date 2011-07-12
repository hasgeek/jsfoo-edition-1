/*
 * This worker is used to persist & read back the IRC back-log from IrisCouch
 */
 
var worker = require("worker").worker;
var CouchClient = require('couch-client');
var connection = CouchClient("http://jsfoobot:foobotpass@netroy.iriscouch.com/irc_jsfoo");
var docId = "backlog";

worker.onmessage = function (message) {
  if(message.save){
    // push the json to couchDB
    connection.save({
      "_id": docId,
      "messages": message.save
    }, function(err, doc){
      if(err){
        console.error("Saving failed");
        console.error(err);
        return;
      }
      worker.postMessage({"saved":true});
    });
  }else if(message.fetch){
    // pull the json from couchDB
    connection.get(docId, function(err, doc){
      if(err) return;
      worker.postMessage({"fetched":doc.messages});
    });
  }
};