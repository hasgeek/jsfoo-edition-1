(function($, window, document, google, _gaq, undefined){
  
  "use strict";

  var body = $(document.body), win = $(window), location = window.location, 
      clearTimeout = window.clearTimeout, setTimeout = window.setTimeout,
      history = window.history, console = window.console || {"log":function(){}},
      historyAPISupported = !!(history && history.pushState),
      hashChangeSupported = !!("onhashchange" in window);

  // Show an empty page to an old browser user, coz we dislike them for not upgrading
  // TODO: act mature & show a message to them
  if(!historyAPISupported && !hashChangeSupported){
    // we dont like this browser
    $("html,body").hide();
    return;
  }


  // TODO: handle konami code
  function initKonami(callback) {
    var code = "38,38,40,40,37,39,37,39,66,65";
    var kkeys = [];

    function handleKonamiKeys(e) {
      kkeys.push(e.keyCode);
      if (kkeys.toString().indexOf(code) >= 0){
        win.unbind('keydown', handleKonamiKeys);
        callback(e);
      }
    }

    win.keydown(handleKonamiKeys);
  }

  initKonami(function(){
    if(console.log){
      console.log("You've hit the magic keys");
    }
  });


  // Extract the page info from the location.pathname
  var requested, base = "", animTimer;
  function parseUrl() {
    if(historyAPISupported){
      requested = location.pathname.substr(1).split("/");
      base = requested[0];
      requested = requested[1] || "home";
    } else {
      requested = location.hash.substr(1) || "home";
    }
    return requested;
  }

  // map the url stuff the section on the grid
  var urlMap = {
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
  }, outer, template;

  // Init DOM stuff
  function initDOM() {
    outer = $("#outer");
    template = $("#template");

    parseUrl();
    if(typeof urlMap[requested] !== 'undefined'){
      body.attr("class", requested + " " + urlMap[requested]);
    } else {
      body.attr("class", "home fourth");
    }

    // window resize handler
    function adjust(){
      var w = win.width()-5, h = win.height()-25;
      if(w < 800){ w = 800; }
      if(h < 300){ h = 300; }
      var adData = {
        "1w": w, "2w": 2*w, "3w": 3*w, "4w": 4*w, "5w": 5*w, "1h": h, "H": h-100
      };
      var output = template.html().replace(/\{[1-5]?(w|h|H)\}/g, function(f){
        return adData[f.replace(/[\{\}]/g,"")] + "px";
      });

      // this querySelector result should not be cached since it gets replaced
      $("#rendered").replaceWith($('<style type="text/css" id="rendered">'+output+'</style>'));
    }

    adjust();
    win.resize(adjust);
  }

  // Handle the URL changes via the History API
  function updateURL(url, e) {
    url = url || "home";
    if(typeof urlMap[url] !== 'undefined'){
      outer.addClass("animated");
      body.attr("class", url + " " + urlMap[url]);
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

  function handleURLChange() {
    updateURL(parseUrl());
  }



  // Parse the URL for city & year
  var params = location.pathname.match(/(bangalore|pune|chennai)(201[12])/);
  var year = params[2];
  var city = params[1];

  // Fetch the proposals for the event
  $.ajax({
    url: "http://funnel.hasgeek.com/jsfoo-"+city+"/json",
    dataType: "jsonp",
    success: function(){
      console.log("build the table now", arguments[0]);
    }
  });



  // Fetch the Map for the venue
  function fetchMap(){
    var mapDiv = document.getElementById("venue-map");
    if(!mapDiv) {
      return;
    }

    var venues = {
      "bangalore2011": {
        "lat": 12.9341,
        "long": 77.6043,
        "url": "http://goo.gl/maps/jYyv",
        "title": "Dharmaram Vidya Kshetram",
        "description": "Christ University Campus.",
        "zoom": 14
      },
      "pune2012": {
        "lat": 18.5334,
        "long": 73.8336,
        "url": "http://g.co/maps/zbznz",
        "title": "Symbiosis Institute Of Computer Studies and Research",
        "description": "Atur Centre, Gokhale Cross Road, Model Colony, Shivaji Nagar.",
        "zoom": 16
      }
    };

    var venue = venues[city + year];
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
  }



  // Remove tracking params from the URL for browsers that support history API, for a cleaner URL
  function kickUtm(){
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
  }



  // Init the top menus & bind the events for history API
  function initMenus() {
    $("header a").live("click", function handleMenus(e) {
      var url = e.target.href;
      url = url.substr(url.lastIndexOf("/")+1);
      if(historyAPISupported){
        if(url === location.pathname.substr(1)){
          return e.preventDefault();
        }
      }else if((hashChangeSupported && url === location.hash.substr(1))) {
        return e.preventDefault();
      }
      if(typeof urlMap[url || "home"] !== 'undefined'){
        if(historyAPISupported){
          history.pushState(null, null, "/"+base+"/"+url);
        }else if(hashChangeSupported){
          location.hash = url || "home";
        }else{
          return;
        }
      }
      updateURL(url, e);
      $(e.target).blur();
    });

    if(historyAPISupported){
      win.bind("popstate", handleURLChange);
    }else if(hashChangeSupported){
      win.bind('hashchange', handleURLChange);
    }
  }



  // Init modal windows, used for sponsor popups
  var showModal, hideModal;
  function initModal() {
    var overlay = $("<div id='overlay' />");
    var modalWindow = $("<div id='modal'><div id='inner' class='georgia' /></div>");
    var modelInner = modalWindow.find("div").first();
    var showingModal = false;

    showModal = function showModal(content){
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
    };

    hideModal = function hideModal(){
      overlay.removeClass("faded");
      modalWindow.removeClass("faded");
      setTimeout(function(){
        modalWindow.hide();
        overlay.hide();
        modelInner.html("");
      }, 400);
      showingModal = false;
    };

    // hide the modal window on Esc key
    win.keydown(function(e){
      if(showingModal && e.which === 27){
        hideModal();
      }
    });
    
    overlay.click(hideModal);

    function adjust() {
      overlay.height(win.height());
    }

    adjust();
    win.resize(adjust);

    body.append(overlay).append(modalWindow);
  }



  // Bind sponsor links to the popups
  function initSponsorsPopup() {
    $(".sponsor-logo a").click(function(e){
      e.preventDefault();
      var id = $(e.target).attr("id");
      if(id.length > 0){
        showModal($("#" + id + "-writeup").html());
      }
      return false;
    });
  }





  // main code
  $(function init() {
    initDOM();

    // menus
    initMenus();

    // modal window
    initModal();

    // sponsor popups
    initSponsorsPopup();

    body.attr("style", "display:block");

    // maps
    setTimeout(fetchMap, 2000);

    // clean urls
    setTimeout(kickUtm, 1000);
  });

})(jQuery, window, document, google, _gaq);