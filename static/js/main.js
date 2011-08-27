(function(window, document, undefined){
  var x=1, y=1, body = document.body, outer = document.getElementById("outer");
  
  var map = {
    "about-event": "p00",
    "about-us": "p01",
    "proposals": "p02",
    "venue": "p10",
    "home": "p11",
    "videos": "p12",
    "sponsors": "p20",
    "credits": "p21",
    "register": "p22"
  }, requested = location.pathname.substr(1);
  
  if(typeof map[requested] !== 'undefined'){
    body.className = map[requested]
  } else {
    body.className = "p"+y+x;
  }
  
  body.setAttribute("style","display:block");
  setTimeout(function(){
    outer.className = "animated";
  },800);
  
  document.addEventListener("keydown", function(e){
    var key = e.charCode || e.keyCode;
    switch(key){
      case 37: // Left
      case 39: // Right
        key = key - 38;
        x += key;
        if(x < 0){
          x = 0;
          return;
        }else if(x > 2){
          x = 2;
          return;
        }else {
          body.className = "p"+y+x;
        }
        break;

      case 38: // Up
      case 40: // Down
        key = key - 39;
        y += key;
        if(y < 0){
          y = 0;
          return;
        }else if(y > 2){
          y = 2;
          return;
        }else {
          body.className = "p"+y+x;
        }
        break;
    }
  }, false);

  
  var template = document.getElementById("template");
  var rendered = document.getElementById("rendered");
  function adjust(){
    var w = body.clientWidth+10, h = body.clientHeight+10;
    if(w < 1000){
      w = 1000;
    }
    if(h < 700){
      h = 700;
    }
    while(rendered.firstChild){
      rendered.removeChild(rendered.firstChild);
    }
    rendered.appendChild(document.createTextNode(template.innerHTML.replace(/{w}/g,w+"px").replace(/{h}/g,h+"px")));
  }
  adjust();
  
  body.addEventListener("click", function(e){
    var x = ~~(Math.random()*3);
    var y = ~~(Math.random()*3);
    body.className = "p"+y+x;      
  });
  
})(window, document);