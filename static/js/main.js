$(function($){
  var x=1, y=1, body = $(document.body), outer = $("#outer");
  
  var map = {
    "about-event": "p00",
    "about-hasgeek": "p01",
    "proposals": "p02",
    "venue": "p10",
    "home": "p11",
    "videos": "p12",
    "sponsors": "p20",
    "credits": "p21",
    "register": "p22"
  }, requested = location.pathname.substr(1);
  
  if(typeof map[requested] !== 'undefined'){
    body.attr("class", requested + " " + map[requested]);
  } else {
    body.attr("class", "p"+y+x);
  }
  body.attr("style","display:block");
  setTimeout(function(){
    outer.addClass("animated");
  },800);
  
  var template = $("#template");
  var rendered = $("#rendered");
  function adjust(){
    var w = body.width(), h = body.height();
    if(w < 1000){ w = 1000; }
    if(h < 700){ h = 700; }
    rendered.empty().text(template.html().replace(/{w}/g,w+"px").replace(/{h}/g,h+"px"));
  }
  adjust();
  $(window).resize(adjust);
  
  $("header a").live("click",function(e){
    e.preventDefault();
    var url = this.href.substr(this.href.lastIndexOf("/")+1);
    if(typeof map[url] !== 'undefined' && url !== location.pathname.substr(1)){
      body.attr("class", url + " " + map[url]);
      history.pushState(null, null, "/"+url);
    }
  });

  $(window).bind("popstate", function(e){
    var url = location.pathname.substr(1);
    if(typeof map[url] !== 'undefined'){
      body.attr("class", url + " " + map[url]);
    }
  });
});