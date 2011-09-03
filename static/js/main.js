$(function($){
  var x=1, y=1, outer = $("#outer");
  var body = $(document.body), location = window.location, 
      history = window.history, console = window.console || {"log":function(){}};
  
  $.fn.knm = function(callback, code) {
		if(code === undefined) code = "38,38,40,40,37,39,37,39,66,65";
		return this.each(function() {
			var kkeys = [];
			$(this).keydown(function(e){
				kkeys.push( e.keyCode );
				if ( kkeys.toString().indexOf( code ) >= 0 ){
					$(this).unbind('keydown', arguments.callee);
					callback(e);
				}
			}, true);
		});
	};
  
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
  }, requested = location.hash || location.pathname.substr(1);
  
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
    rendered.empty().text(template.html().replace(/\{w\}/g,w+"px").replace(/\{h\}/g,h+"px"));
  }
  adjust();
  $(window).resize(adjust);
  
  
  
  var historyAPISupported = !!(history && history.pushState);
  var hashChangeSupported = !!("onhashchange" in window);

  $("header a").live("click",function(e){
    var url = this.href.substr(this.href.lastIndexOf("/")+1);
    if(typeof map[url] !== 'undefined' && url !== location.pathname.substr(1)){
      body.attr("class", url + " " + map[url]);
      if(historyAPISupported){
        history.pushState(null, null, "/"+url);
      }else if(hashChangeSupported){
        location.hash = url;
      }else{
        return;
      }
    }
    $(this).blur();
    e.preventDefault();
  });

  if(historyAPISupported){
    $(window).bind("popstate", function(e){
      var url = location.pathname.substr(1);
      if(typeof map[url] !== 'undefined'){
        body.attr("class", url + " " + map[url]);
      }
    });
  }else if(hashChangeSupported){
    $(window).bind( 'hashchange', function(e){
      var url = location.hash.substr(1);
      if(typeof map[url] !== 'undefined'){
        body.attr("class", url + " " + map[url]);
      }
    });
  }
  
  // konami code
  $(window).knm(function(){
    if(console.log){
      console.log("u've hit the magic keys");
    }
  });
  
  // maps
  (function(){
    var latlng = new google.maps.LatLng(12.9341, 77.6043);
    var mapOptions = {
      zoom: 14,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("venue-map"), mapOptions);
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      title: "Dharmaram College"
    });
    var infowindow = new google.maps.InfoWindow({
      content: '<h3>Dharmaram College</h3><p>Christ University Campus. <a target="_blank" href="http://goo.gl/maps/jYyv">See larger map</a>.</p>'
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
    infowindow.open(map, marker);
  })();

});