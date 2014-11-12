// Programmer: Doug Melville, Joseph Pantoga
// Date: November 11, 2014

// global constants
const jsonFileName = "demo.json";
const canvasId = "canvas";
const taskIdPrefix = "task";
const taskContainerType = "g";
const fontSize = "12px";
const fontFamily = "sans-serif";
const PADDING_Text_x = 50;
const PADDING_Text_y = 50;
const canvasWidth = 1240;
const canvasHeight = 700;

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

// Finds element within supplied tree/object
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
  
  // TODO: add an onclick to the canvas so that people can select it to add more roots
  // TODO NOTE: To do this task we might need to have the system split the canvas evenly bewteen x partitions, unless someone can get partition to work correctly with two actual roots, I can't. 
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

// Tags d as the selectedObject and highlights it red for users
function updateSelectedObject(d){
  if(selectedObject){ 
    dataToDOM(selectedObject).attr("style", "");
  }
  selectedObject = d;
  dataToDOM(selectedObject).attr("style", "fill:#FF3300;");
}

function clickHandler(d) {
  // zoom to selected object.
  zoomTo(d, 250);

  updateSelectedObject(d);

  // Updates edit's form to reflect the data in the selected object.
  var inputs = document.getElementById("editData").getElementsByTagName("input");
  inputs[0].value = selectedObject.name;
  if(selectedObject.details){ // I personally I don't like it when the box says 'undefined'
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
  // Create rectangle  
  newGroups.append("rect")
    .attr("id", function(d){ return taskIdPrefix + d.id; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
    .on("click", clickHandler)
  // Add text to rectangle
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

// Redrawing the canvas with the new/updated dataTree.
function redraw(){
  clearCanvas(canvas);
  partitionedTree = jQuery.extend(true, {}, dataTree);
  maxId = partition(partitionedTree).length; // This screws up delete 
  drawTree(canvas, partition(partitionedTree), function(){
    // zoom back to the selected object
    var updatedObj = depthFirstSearch(partitionedTree, selectedObject.id);
    console.log(updatedObj);
    zoomTo(updatedObj, 0);
    updateSelectedObject(updatedObj);
  });
}

function addClickHandler(){ // TODO: if too many items are added then the text starts to get out of line.
  if (selectedObject == null) { alert("Select a task first!"); return; } // Check if anything is selected

  var inputs = document.getElementById("addData").getElementsByTagName("input");
  var title = inputs[0].value;
  var text = inputs[1].value; // Need to check if we need this.

  if (title == "") {
      alert("The name of the task is required!");
      return;
  }

  element = depthFirstSearch(dataTree, selectedObject.id);

  newElement = {
      "id": maxId,
      "name": title,
      "details": text,  // TODO: Determine if we want this or not I'm thinking yes.
      "children":[]
  };

  // push to its children, we need to do one of two methods which depend on whether or not it has children now.
  if(element.children){
    element.children.push(newElement);
  }else{
    element.children = [newElement];
  }
}

function editClickHandler(){
  if (selectedObject == null) { alert("Select a task first!"); return; } // Check if anything is selected

  var inputs = document.getElementById("editData").getElementsByTagName("input"); // This gives us an array of the inputs of editData
  var title = inputs[0].value;
  var text = inputs[1].value;

  if (title == "") { // Titles can't be blank so we enforce this rule here.
      alert("The title can't be blank!");
      return;
  }
  if (title == selectedObject.name) { // no point in redrawing or anything if nothing changed.
      console.log("The title didn't change.");
      if (selectedObject.details) {
          if (text == selectedObject.details) {
              console.log("The details didn't change either");
              return;
          }
      }
  }

  // If something is different then we will update that element and then redraw.
  element = depthFirstSearch(dataTree, selectedObject.id);  
  element.name = title;
  element.details = text; 
}

function deleteClickHandler(){ // BUG: canvas goes black if you delete the last child in rootTask. We need to fix this or somehow avoid this case.
    if (selectedObject == null) { alert("Select a task first!"); return; } // Check if anything is selected

    // Getting these two items allow delete to work
    var parent = depthFirstSearch(dataTree, selectedObject.parent.id);
    var selectedParent = selectedObject.parent; // This reduces errors in deletion

    if (selectedObject.children) { // Does the selected node have children?
        if(!confirm("Delete all tasks below this one?")) // If the user says no, then we alert the user what they can do, and then cancel the function.
        {
            alert("Canceling deletion. Delete the lower tasks first");
            return;
        }
    }
    // Find the index for the child 
    parent.children.forEach(function (child, index) {
        if (child.name == selectedObject.name) { 
            parent.children.splice(index, 1); // Updates dataTree
            selectedParent.children.splice(index,1) // Updates selectedObject's parent. This reduces errors that can come up in redraw.
        }
    });
    selectedObject = selectedParent; // We can't reselect the deleted task now can we.
}

// startup run
d3.json(jsonFileName, function(error, root){
  canvas = createCanvas();
  dataTree = jQuery.extend(true, {}, root);
  partitionedTree = root;
  drawTree(canvas, partition(partitionedTree), null);
});
