var bigRoot;

var width = 960,
    height = 500;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([0, height]);

var color = d3.scale.category20c();

var rect;
var selectedObj;

var path;

var draw = function(data){

  var partition = d3.layout.partition()
      .children(function(d) { return isNaN(d.value) ? d3.entries(d.value) : null; })
      .value(function(d) { return d.value; });

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id","canvas")
      .attr("display","block");
  
  rect = svg.selectAll("rect");
  
  rect = rect
      .data(partition(d3.entries(data)[0]))
      .enter().append("rect")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.dx); })
      .attr("height", function(d) { return y(d.dy); })
      .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
      .on("click", clicked);
}

var arrayPath = function(target){
    var entirePath = []
    var currentObj = target;
    if(currentObj.parent == undefined){
      return null;
    }
    else{
        while(currentObj.parent != undefined){
             entirePath.push(currentObj.key)
             currentObj = currentObj.parent;
        }
    }
    console.log("Path: ",entirePath.reverse());
    return entirePath;
}

var searchRect = function(target){
    var found;
    rect[0].forEach(function(element){ // TODO: we need a way to break/exit the loop when we find target
         //console.log("Element: ",element.__data__);
         if(element.__data__.key == target){
           found = element.__data__;
         }
    }); 
    return found;
}

var addWithPath = function(title,text){
   var addTo = bigRoot['goals'];
   var leaf = undefined;
   path.forEach(function(obj){
        if(typeof(addTo[obj]) == "object"){
           addTo = addTo[obj]
        }
        else{
          leaf = obj;
        }
   });
   if(typeof(leaf) != undefined){
     addTo[leaf] = {title:texe}
     selectedObject = addTo;
   }
   else{
       addTo[title] = text;
   }
   return 
}

function redraw(){
  var targetElement;
  var currentPath = path;
  clickMe = d3.select("#canvas").select("rect");
  d3.select("#canvas").attr("display","none");
  clicked(clickMe.data()[0],0);
  d3.select("#canvas").remove();
  draw(bigRoot);
  if(typeof(currentPath) == "undefined" || currentPath[0] == 'goals'){
    targetElement = searchRect('goals');
  }
  else{
   targetElement = searchRect(currentPath[currentPath.length - 1]);
  }
  d3.select("#canvas").attr("display","block");
  clicked(targetElement,0);
}

function add(){
   var inputs = document.getElementById("addData").getElementsByTagName("input");
   var title = inputs[0].value;
   var text = inputs[1].value;
   if(title == "" || text == ""){
     alert("Name of task and a description is required!");
     return;
   }
   if(typeof(path) == "undefined" || path[0] == 'rootTask'){
     bigRoot['rootTask'][title] = text;
   }
   else{addWithPath(title,text);}
   redraw();
}

function edit(){
   alert("Insert Edit Logic");
}

function remove(){
   alert("Insert Delete Logic");
}

function clicked(d,dur) {
  var dura = dur;
  if(dura == null || dura > 0){
     dura = 750;
  }
  else {
    dura = 0;
  }
  x.domain([d.x, d.x + d.dx]);
  y.domain([d.y, 1]).range([d.y ? 20 : 0, height]);

  rect.transition()
      .duration(dura)
      .attr("x_old", function(d) { return d.x; })
      .attr("y_old", function(d) { return d.y; })
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
      .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
  selectedObj = d;
  if(selectedObj.key != "goals"){
    path = arrayPath(selectedObj);
  }
  else{
   path = undefined;
  }
}


document.getElementById("add").addEventListener("click",function (){add();});
document.getElementById("edit").addEventListener("click",function (){edit();});
document.getElementById("delete").addEventListener("click",function (){remove();});

d3.json("readme4.json", function(error, root) {
    bigRoot = root;
    draw(bigRoot);
});