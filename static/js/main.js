// TODO: handle konami code & show message on ancient browsers

// main code
$(function($){
  
  var body = $(document.body), location = window.location, 
      history = window.history, console = window.console || {"log":function(){}},
      historyAPISupported = !!(history && history.pushState),
      hashChangeSupported = !!("onhashchange" in window);

  if(!historyAPISupported && !hashChangeSupported){
    // we dont like this browser
    $("html,body").hide();
    return;
  }

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

  // konami code
  $(window).knm(function(){
    if(console.log){
      console.log("You've hit the magic keys");
    }
  });
  
  var outer = $("#outer");
  var map = {
    "about-event": "first",
    "about-hasgeek": "second",
    "schedule": "third",
    "venue": "fourth",
    "home": "fifth",
    "hack-night": "sixth",
    "videos": "seventh",
    "sponsors": "eigth",
    "credits": "ninth",
    "register": "tenth"
  }, requested = location.hash.substr(1) || location.pathname.substr(1) || "home";
  
  if(typeof map[requested] !== 'undefined'){
    body.attr("class", requested + " " + map[requested]);
  } else {
    body.attr("class", "home fourth");
  }
  
  var template = $("#template");
  function adjust(){
    var w = $(window).width()-5, h = $(window).height()-25;
    if(w < 800){ w = 800; }
    if(h < 300){ h = 300; }
    var adData = {
      "1w": w, "2w": 2*w, "3w": 3*w, "4w": 4*w, "5w": 5*w, "1h": h, "H": h-110
    };
    var output = template.html().replace(/\{[1-5]?(w|h|H)\}/g, function(f){
      return adData[f.replace(/[\{\}]/g,"")] + "px";
    });
    $("#rendered").replaceWith($('<style type="text/css" id="rendered">'+output+'</style>'));
  }
  adjust();
  var sizeTimer;
  $(window).resize(adjust);
  body.attr("style","display:block");
  
  
  var animTimer;
  function updateURL(url, e){
    url = url || "home";
    if(typeof map[url] !== 'undefined'){
      outer.addClass("animated");
      body.attr("class", url + " " + map[url]);
      clearTimeout(animTimer);
      animTimer = setTimeout(function(){
        outer.removeClass("animated");
      },500);
      if(_gaq instanceof Array){
        _gaq.push(['_trackPageview', url]);
      }
      if(e){
        e.preventDefault();
      }
    }
  }

  $("header a").live("click",function(e){
    var url = this.href.substr(this.href.lastIndexOf("/")+1);
    if(historyAPISupported){
      if(url === location.pathname.substr(1)){
        return e.preventDefault();
      }
    }else if((hashChangeSupported && url === location.hash.substr(1))) {
      return e.preventDefault();
    }
    if(typeof map[url || "home"] !== 'undefined'){
      if(historyAPISupported){
        history.pushState(null, null, "/"+url);
      }else if(hashChangeSupported){
        location.hash = url || "home";
      }else{
        return;
      }
    }
    updateURL(url, e);
    $(this).blur();
  });

  if(historyAPISupported){
    $(window).bind("popstate", function(e){
      var url = location.pathname.substr(1) || "home";
      updateURL(url);
    });
  }else if(hashChangeSupported){
    $(window).bind( 'hashchange', function(e){
      var url = location.hash.substr(1);
      updateURL(url);
    });
  }
  
  // maps
  setTimeout(function fetchMap(){
    var styles = [{ featureType: "all", elementType: "all", stylers: [{hue: '#eecc70'}, { saturation: -70 }, { gamma: 0.70 }]}];
    var retroMapType = new google.maps.StyledMapType(styles, {});
    var dharmaram = new google.maps.LatLng(12.9341, 77.6043);
    var mapOptions = {
      zoom: 14,
      center: dharmaram,
      mapTypeControlOptions: { mapTypeIds: [ 'Styled'] },
      mapTypeId: 'Styled'
    };
    var map = new google.maps.Map(document.getElementById("venue-map"), mapOptions);
    map.mapTypes.set('Styled', retroMapType);

    var marker = new google.maps.Marker({
      position: dharmaram,
      map: map,
      title: "Dharmaram Vidya Kshetram"
    });
    var infowindow = new google.maps.InfoWindow({
      content: '<h3>Dharmaram Vidya Kshetram</h3><p>Christ University Campus. <a target="_blank" href="http://goo.gl/maps/jYyv">See larger map</a>.</p>'
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
    infowindow.open(map, marker);
  },1000);
  
  setTimeout(function kickUtm(){
    if(history.replaceState && location.search.indexOf("utm_") > 0){
      var orig = location.href;
      var fixed = orig.replace(/\?([^#]*)/, function(_, search) {
        search = search.split('&').map(function(v) {
          return !/^utm_/.test(v) && v;
        }).filter(Boolean).join('&');
        return search ? '?' + search : '';
      });
      if ( fixed != orig ) {
        history.replaceState({}, '', fixed);
      }
    }
  },1000);

});