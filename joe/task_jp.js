// Programmer: Doug Melville, Joseph Pantoga
// Date: November 8, 2014
// File: index2.js
// Purpose: a reorganized version of the index code

// global constants
const jsonFileName = "demo.json";
const canvasId = "canvas";
const addBtnId = "BTN_add";
const editBtnId = "BTN_edit";
const deleteBtnId = "BTN_delete";
const taskIdPrefix = "task";
const taskContainerType = "g";
const fontSize = "12px";
const fontFamily = "sans-serif";
const PADDING_Text_x = 50;
const PADDING_Text_y = 50;
const canvasWidth = 960;
const canvasHeight = 500;

// global variables
// state keeping
var selectedObject = null;
var dataTree = null;
var partitionedTree = null;
var canvas = null;
var maxId = Number.NEGATIVE_INFINITY;

// for partitioning
var x = d3.scale.linear().range([0, canvasWidth]);
var y = d3.scale.linear().range([0, canvasHeight]);
var color = d3.scale.category20c();
var partition = d3.layout.partition()
  /*.children(function(d) { return isNaN(d.value) ? d3.entries(d.value) : null; })*/
  .children(function(d){ return d.children; })
  // by default: dx = node.value ? dx / node.value : 0;
  // so we need a value to get a width, which is useful for value-based organization
  .value(function(d) { 
    // return something to trick d3 into making the width constant, see here:
    // http://stackoverflow.com/questions/12100914/d3-how-to-make-visualization-with-a-partition-layout-have-equally-divided-sect
    return 1; 
  });

function getMaxId(root){
  if(root.id > maxId){
    maxId = root.id;
  }
  if(root.children){
    for(var i=0; i < root.children.length; i++){
      getMaxId(root.children[i]);
    }
  }
}

function depthFirstSearch(root, elementId){
  console.log("DFS at: " + root.id + " looking for " + elementId);
  console.log(root.id == elementId);
  if(root.id == elementId){
    return root;
  }else{
    if(root.children){
      var result = null;
      for(var i=0; i < root.children.length; i++){
        result = depthFirstSearch(root.children[i], elementId);
        if(result){
          return result;
        }
      }
    }
  }
}

function dataToDOM(data){
  var selectorString = "#" + taskIdPrefix + data.id;
  domElement = d3.select(selectorString);
  return domElement;
}

function createCanvas(){
  
  // TODO: add an onclick to the canvas so that people can select it to
  // add more roots
  var localCanvas = d3.select("body").append("svg")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight)
    .attr("id", canvasId)
    .attr("display", "block");

  return localCanvas;
}

function clearCanvas(c){
  allSVG = c.selectAll("*").remove();
  // reset the x and y functions to pre-zoomed state
  x = d3.scale.linear().range([0, canvasWidth]);
  y = d3.scale.linear().range([0, canvasHeight]);
}

function zoomTo(d, duration){
  // clip the width to the width of whatever was clicked
  x.domain([d.x, d.x + d.dx]);
  // make the height map from 0,1 -> 0 (or 20 for the root) to canvasHeight
  y.domain([d.y, 1]).range([d.y ? 20 : 0, canvasHeight]);
  
  // grab every single rect in our canvas
  rects = d3.select("#"+canvasId).selectAll("rect");
  rects.transition()
    .duration(duration)
    .attr("x_old", function(d) { return d.x; })
    .attr("y_old", function(d) { return d.y; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });

  texts = d3.select("#"+canvasId).selectAll("text");
  texts.transition()
    .duration(duration)
    .attr("x_old", function(d) { return d.x; })
    .attr("y_old", function(d) { return d.y; })
    .attr("x", function(d) { return x(d.x) + PADDING_Text_x; })
    .attr("y", function(d) { return y(d.y) + PADDING_Text_y; })
  
}

function updateSelectedObject(d){
  if(selectedObject){
    lastSelectedDOMObject = dataToDOM(selectedObject);
    lastSelectedDOMObject.attr("style", "");
  }

  selectedObject = d;
  newlySelectedDOMObject = dataToDOM(selectedObject);
  newlySelectedDOMObject.attr("style", "fill:#FF3300;");
}

function clickHandler(d){
  // zoom to this data
  zoomTo(d, 250);

  // tag this as the selected object and highlight it
  updateSelectedObject(d);

  var inputs = document.getElementById("editData").getElementsByTagName("input");
  inputs[0].value = selectedObject.name;
  if(inputs[1].value){
     inputs[1].value = selectedObject.details;
  }
}

function drawTree(canvas, partitionedData, completionHandler){
  var theGroups = d3.select("#"+canvasId).selectAll(taskContainerType).data(partitionedData);

  // new dom element
  var newGroups = theGroups.enter().append(taskContainerType)
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    
  newGroups.append("rect")
    .attr("id", function(d){ return taskIdPrefix + d.id; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
    .on("click", clickHandler)

  newGroups.append("text")
    .text(function(d) { return d.name; })
    .attr("x", function(d) { return x(d.x) + PADDING_Text_x; })
    .attr("y", function(d) { return y(d.y) + PADDING_Text_y; })
    .attr("font-family", fontFamily)
    .attr("font-size", fontSize)
    .attr("fill", "black");

  // old dom elements
  theGroups.exit().remove();

  // call the completionHandler
  if(completionHandler){
    completionHandler();
  }
}

function checkIfSelected(){ // Check if anything is selected
         return (selectedObject == null)
	 
}

function redraw(){
  // redraw
  clearCanvas(canvas);
  partitionedTree = jQuery.extend(true, {}, dataTree);
  drawTree(canvas, partition(partitionedTree), function(){
    // zoom back to the selected object
    var updatedObj = depthFirstSearch(partitionedTree, selectedObject.id);
    console.log(updatedObj);
    zoomTo(updatedObj, 0);
    updateSelectedObject(updatedObj);
  });
}

function addClickHandler(){
  if(checkIfSelected()){alert("Select a task first!");return;}
  var inputs = document.getElementById("addData").getElementsByTagName("input");
  var title = inputs[0].value;
  var text = inputs[1].value;
  if (title == "" || text == "") {
      alert("Name of task and a description is required!");
      return;
  }
  // find this element in the data tree (use id)
  element = depthFirstSearch(dataTree, selectedObject.id);

  // get a unique id
  getMaxId(dataTree);
  newId = maxId + 1;

  newElement = {
      "id": newId,
      "name": title,
  //    "details": text,  // TODO: Determine if we want this or not I'm thinking yes.
      "children":[]
  };

  // push to its children
  if(element.children){
    element.children.push(newElement);
  }else{
    element.children = [newElement];
  }
  
  redraw();
/*  
  // redraw
  clearCanvas(canvas);
  partitionedTree = jQuery.extend(true, {}, dataTree);
  drawTree(canvas, partition(partitionedTree), function(){
    // zoom back to the selected object
    var updatedObj = depthFirstSearch(partitionedTree, selectedObject.id);
    console.log(updatedObj);
    zoomTo(updatedObj, 0);
    updateSelectedObject(updatedObj);
  }); */
}

function editClickHandler(){
  if(checkIfSelected()){alert("Select a task first!");return;}
  var inputs = document.getElementById("editData").getElementsByTagName("input");
  var title = inputs[0].value;
  var text = inputs[1].value;
  if (title == "") {
      alert("A task name is required!");
      return;
  }
  // find this element in the data tree (use id)
  element = depthFirstSearch(dataTree, selectedObject.id);  
  element.name = title;
  element.details = text; 
  redraw();
}

function deleteClickHandler(d){
  if(checkIfSelected()){alert("Select a task first!");return;}
  console.log("delete button clicked");
}

// startup run
d3.json(jsonFileName, function(error, root){
  canvas = createCanvas();
  dataTree = jQuery.extend(true, {}, root);
  partitionedTree = root;
  drawTree(canvas, partition(partitionedTree), null);
});








