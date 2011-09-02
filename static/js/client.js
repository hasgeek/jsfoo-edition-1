(function() {
  //var console = console || {log:function(){}};
  var partial = "<p><time data='{time}'>{pretty(time)}</time><u>{from}</u><span>{linkify(text)}</span></p>";
  var entities = {"<":"&lt;",">":"&gt;",'&':'&amp;','"':'&quot;',"'": '&#146;'};

  function render(b,c){
    return b.replace(/\{[\w\.\(\)]+\}/g,function(a){
      a=a.replace(/[\{\}]/g,"");
      try{
        with(c){
          return eval(a);
        }
      }catch(b){
        return"";
      }
    });
  }

  function linkify(a){
    a=a.replace(/[&"'><]/g,function(b){return entities[b];});
    a=a.replace(/((https?):\/\/([\-\w\.]+)+(:\d+)?(\/([\w\/_\.\-#\+:!]*(\?\S+)?)?)?)/gm,'<a href="$1" target="_blank">$1</a>');
    a=a.replace(/^\@?([\w]*):/,function(a){return a==="http"?a:a.bold();});
    return a;
  }

  function pretty(a,b,c){
    a=parseInt(a,10);
    a=(new Date()-new Date(a))/1E3;
    b=[60,60,24];
    for(c=0;a>b[c];a/=b[c++]){}
    a=~~a;
    return c===0&&a<10?"now":a+" "+"sec0min0hour0day".split(0)[c]+(a>1?"s":"")+" ago";
  }

  setInterval(function(){
    $("time").each(function(){
      $(this).html(pretty($(this).attr("data")));
    });
    $("section i").remove();
  },6E4);
  function rescale(){
    $("#log,#names").height($(window).height()-180);
  }
  rescale();
  $(window).resize(rescale);

  var socket  = io.connect();
  var nameList = $("#names");
  var messageLog = $("#log");
  var last = 0;

  socket.on('connect', function() {
    console.log('Connected');
  });

  socket.on('names', function(names){
    nameList.empty();
    for(var nick in names){
      if(names.hasOwnProperty(nick)){
        nameList.prepend("<li><u id='li_"+nick+"'>"+nick+"</u></li>");
      }
    }
  });

  socket.on('join', function(nick){
    nameList.prepend("<li><u id='li_"+nick+"'>"+nick+"</u></li>");
  });

  socket.on('part', function(nick){
    nameList.find("#li_"+nick).remove();
  });

  socket.on('nick', function(old, nick){
    nameList.find("#li_"+old).each(function(){
      $(this).attr("id", "#li_"+nick).html(nick);
    });
  });

  socket.on('topic', function(topic){
    $("#topic").html(topic);
  });

  socket.on("message", function(m){
    if(!(m instanceof Array)){
      m = [m];
    }
    for(var i=0, l=m.length; i<l; i++){
      if(m[i].time <= last){
        continue;
      }
      messageLog.append(render(partial,m[i]));
      last = m[i].time;
    }
    messageLog[0].scrollTop = messageLog[0].scrollHeight;
  });
})();