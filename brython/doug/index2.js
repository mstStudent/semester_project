// Programmer: Doug Melville, Joseph Pantoga
// Date: November 8, 2014
// File: index2.js
// Purpose: a reorganized version of the index code

// we need to keep track of the entire data structure all the time :/
// keeping it in the dom using the __data__ attribute doesn't cut it (WHY?)

// global constants
const jsonFileName = "readme4.json";
const canvasId = "canvas";
const addBtnId = "BTN_add";
const editBtnId = "BTN_edit";
const deleteBtnId = "BTN_delete";
const taskIdPrefix = "task";
const canvasWidth = 960;
const canvasHeight = 500;

// global variables
// state keeping
var selectedObject = null;
var dataTree = null;
var jsonTree = null;
var maxId;

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

function depthFirstSearch(root, elementId){
  console.log("root.id: " + root.id + " elementId: " + elementId);
  if(root.id == elementId){
    return root;
  }else{
    if(root.children){
      for(var i=0; i < root.children.length; i++){
        depthFirstSearch(root.children[i], elementId);
      }
    }
  }
}

function dataToDOM(data)
{
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
  allSVG = c.selectAll("rect").remove();
}

function clickHandler(d){
  // clip the width to the width of whatever was clicked
  x.domain([d.x, d.x + d.dx]);
  // make the height map from 0,1 -> 0 (or 20 for the root) to canvasHeight
  y.domain([d.y, 1]).range([d.y ? 20 : 0, canvasHeight]);

  // grab every single rect in our canvas
  rects = d3.select("#"+canvasId).selectAll("rect");
  rects.transition()
    .duration(500)
    .attr("x_old", function(d) { return d.x; })
    .attr("y_old", function(d) { return d.y; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });

  // tag this as the selected object and highlight it
  if(selectedObject){
    lastSelectedDOMObject = dataToDOM(selectedObject);
    lastSelectedDOMObject.attr("style", "");
  }

  selectedObject = d;
  newlySelectedDOMObject = dataToDOM(selectedObject);
  newlySelectedDOMObject.attr("style", "fill:#FF3300;");
}

function drawTree(canvas, dataToPartition) {
    d3.select("#" + canvasId).remove();
    createCanvas();
    var partitionedData = partition(dataToPartition);
    dataTree = partitionedData;
    maxId = partitionedData.length;
  // console.log("partitionedData: " + partitionedData);
  var selection = d3.select("#"+canvasId).selectAll("rect").data(partitionedData);

  // new dom elements
  selection.enter().append("rect")
    .attr("id", function(d){ return taskIdPrefix + d.id; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
    .on("click", clickHandler);

  // old dom elements
  selection.exit().remove();
}

// create the canvas
var canvas = createCanvas();

<<<<<<< HEAD
function addClickHandler(d){
  // find this element in the data tree (use id)
  element = depthFirstSearch(dataTree, selectedObject.id);

  // create a new element TODO: pull from the forms
  newElement = {
    "id":6,
    "name":"newTask",
    "children":[]
  };

  // push to its children
  if(element.children){
    element.children.push(newElement);
  }else{
    console.log("had no children, attempting to create a new array");
    element.children = [newElement];
  }
  
  // redraw
  clearCanvas(canvas);
  drawTree(canvas, partition(dataTree));
  
=======
function findOwner(parentToFind) {
    var parent;
    if (parentToFind.name != "rootTask") { // TODO: Need to reach selectedObj in jsonTree.
        pass;

    } else {
        return jsonTree;
    }
}

function addClickHandler() {
    var newTask = { "id": maxId, "name": "newTask" }
    findOwner(selectedObject).children.push(newTask);
  drawTree(canvas, jsonTree);
>>>>>>> FETCH_HEAD
}

function editClickHandler(){
  console.log("edit button clicked");
}

function deleteClickHandler(){
  console.log("delete button clicked");
}

// add interactivity
d3.select("#" + addBtnId).on("click", addClickHandler);
d3.select("#" + editBtnId).on("click", editClickHandler);
d3.select("#" + deleteBtnId).on("click", deleteClickHandler);


// startup run
<<<<<<< HEAD
d3.json(jsonFileName, function(error, root){
  // save the data to memory
  dataTree = root;
  drawTree(canvas, partition(dataTree));
=======
d3.json(jsonFileName, function (error, root) {
    jsonTree = $.extend(true, {}, root); // deep copy root without referencing it.
  // var entries = d3.entries(root)[0];
  //console.log("attempting to partition root: " + JSON.stringify(root));
  //console.log(dataWithLayoutInfo[0]);
  drawTree(canvas, root);
>>>>>>> FETCH_HEAD
});

// interactivity







