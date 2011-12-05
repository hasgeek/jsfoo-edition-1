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
  
  function parseUrl(){
    if(historyAPISupported){
      requested = location.pathname.substr(1).split("/");
      base = requested[0];
      requested = requested[1] || "home";
    } else {
      requested = location.hash.substr(1) || "home";
    }
    return requested;
  }

  // konami code
  $(window).knm(function(){
    if(console.log){
      console.log("You've hit the magic keys");
    }
  });
  
  var outer = $("#outer");
  var overlay = $("<div id='overlay' />");
  var modalWindow = $("<div id='modal'><div id='inner' class='georgia' /></div>");
  var modelInner = modalWindow.find("div").first();
  var map = {
    "about-event": "first",
    "about-hasgeek": "second",
    "schedule": "third",
    "venue": "fourth",
    "home": "fifth",
    "hacknight": "sixth",
    "videos": "seventh",
    "sponsors": "eigth",
    "credits": "ninth",
    "register": "tenth"
  };
  var requested, base = "";  
  parseUrl();
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
      "1w": w, "2w": 2*w, "3w": 3*w, "4w": 4*w, "5w": 5*w, "1h": h, "H": h-100
    };
    var output = template.html().replace(/\{[1-5]?(w|h|H)\}/g, function(f){
      return adData[f.replace(/[\{\}]/g,"")] + "px";
    });
    $("#rendered").replaceWith($('<style type="text/css" id="rendered">'+output+'</style>'));
    
    overlay.height($(window).height());
  }
  adjust();
  var sizeTimer;
  $(window).resize(adjust);
  body.attr("style","display:block").append(overlay).append(modalWindow);
  
  
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
        history.pushState(null, null, "/"+base+"/"+url);
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
      updateURL(parseUrl());
    });
  }else if(hashChangeSupported){
    $(window).bind( 'hashchange', function(e){
      updateURL(parseUrl());
    });
  }
  
  // maps
  setTimeout(function fetchMap(){
    var mapDiv = document.getElementById("venue-map");
    if(!mapDiv) {
      return;
    }

    var venues = {
      "2011-bangalore": {
        "lat": 12.9341,
        "long": 77.6043,
        "url": "http://goo.gl/maps/jYyv",
        "title": "Dharmaram Vidya Kshetram",
        "description": "Christ University Campus.",
        "zoom": 14
      },
      "2012-pune": {
        "lat": 18.5334,
        "long": 73.8336,
        "url": "http://g.co/maps/zbznz",
        "title": "Symbiosis Institute Of Computer Studies and Research",
        "description": "Atur Centre, Gokhale Cross Road, Model Colony, Shivaji Nagar.",
        "zoom": 16
      }
    };

    var venue = venues[mapDiv.getAttribute("rel")];
    if(!venue) {
      return;
    }

    var styles = [{ featureType: "all", elementType: "all", stylers: [{hue: '#eecc70'}, { saturation: -70 }, { gamma: 0.70 }]}];
    var retroMapType = new google.maps.StyledMapType(styles, {});
    var center = new google.maps.LatLng(venue.lat, venue.long);
    var mapOptions = {
      zoom: venue.zoom,
      center: center,
      mapTypeControlOptions: { mapTypeIds: [ 'Styled'] },
      mapTypeId: 'Styled'
    };
    var map = new google.maps.Map(mapDiv, mapOptions);
    map.mapTypes.set('Styled', retroMapType);

    var marker = new google.maps.Marker({
      position: center,
      map: map,
      title: venue.title
    });
    var infowindow = new google.maps.InfoWindow({
      content: '<h3>' + venue.title + '</h3><p>' + venue.description + ' <a target="_blank" href="' + venue.url + '">See larger map</a>.</p>'
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
    infowindow.open(map, marker);
  },2000);
  
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
  
  // Modal window
  var showingModal = false;
  function modal(content){
    overlay.show();
    modelInner.html(content||"");
    modalWindow.show();
    setTimeout(function(){
      modalWindow.addClass("faded");
    }, 50);
    setTimeout(function(){
      overlay.addClass("faded");
    }, 200);
    showingModal = true;
  }

  function hideModal(){
    overlay.removeClass("faded");
    modalWindow.removeClass("faded");
    setTimeout(function(){
      modalWindow.hide();
      overlay.hide();
      modelInner.html("");
    }, 400);
    showingModal = false;
  }
  
  $(".sponsor-logo a").click(function(e){
    e.preventDefault();
    var id = $(this).attr("id");
    if(id.length > 0){
      modal($("#" + id + "-writeup").html());
    }
    return false;
  });

  $(this).keydown(function(e){
    if(showingModal && e.which === 27){
      hideModal();
    }
  });

  overlay.click(hideModal);

});

/*
$(function(){
	$("#sponsor-microsoft").click(function(){
		$("#sponsors-line-1").toggleClass('ragged-bottom');
		$("#sponsor-microsoft-writeup").toggleClass('hidden');
		$("#sponsors-line-2").toggleClass('ragged-top');
		return false;
	});
	$("#sponsor-fusioncharts").click(function(){
		$("#sponsors-line-2").toggleClass('ragged-bottom');
		$("#sponsor-fusioncharts-writeup").toggleClass('hidden');
		$("#sponsors-line-3").toggleClass('ragged-top');
		return false;
	});
	$("#sponsor-novojuris").click(function(){
		$("#sponsors-line-2").toggleClass('ragged-bottom');
		$("#sponsor-novojuris-writeup").toggleClass('hidden');
		$("#sponsors-line-3").toggleClass('ragged-top');
		return false;
	});
});
*/
