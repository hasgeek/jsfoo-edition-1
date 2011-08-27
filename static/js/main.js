(function(window, document, undefined){
  var x=1, y=1, body = document.body;
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
      default:
        console.log(key);
        break;
    }
  }, false);

  body.className = "p"+y+x;
  
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