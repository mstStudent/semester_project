// Programmer: Doug Melville, Joseph Patagona
// Date: November 8, 2014
// File: index2.js
// Purpose: a reorganized version of the index code

// global constants
const jsonFileName = "readme4.json";
const canvasId = "canvas"
const canvasWidth = 960;
const canvasHeight = 500;

// global variables

function createCanvas(){
  
  var canvas = d3.select("body").append("svg")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight)
    .attr("id", canvasId)
    .attr("display", "block");

  return canvas;
}

// whatever the fuck this bullshit is
var x = d3.scale.linear().range([0, canvasWidth]);
var y = d3.scale.linear().range([0, canvasHeight]);
var color = d3.scale.category20c();
var partition = d3.layout.partition()
      .children(function(d) { return isNaN(d.value) ? d3.entries(d.value) : null; })
      .value(function(d) { return d.value; });

function clickHandler(d){
  x.domain([d.x, d.x + d.dx]);
  y.domain([d.y, 1]).range([d.y ? 20 : 0, canvasHeight]);

  rect.transition()
    .duration(500)
    .attr("x_old", function(d) { return d.x; })
    .attr("y_old", function(d) { return d.y; })
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
}

function drawTree(canvas, partitionedData){
  var selection = d3.select("#"+canvasId).selectAll("rect").data(partitionedData);

  // new dom elements
  selection.enter().append("rect")
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

// startup run
d3.json(jsonFileName, function(error, root){
  //console.log("root: " + JSON.stringify(root));
  var entries = d3.entries(root)[0];
  //console.log("entries[0]: " + JSON.stringify(entries));
  var dataWithLayoutInfo = partition(entries);
  //console.log("dataWithLayoutInfo: " + JSON.stringify(dataWithLayoutInfo));
  drawTree(canvas, dataWithLayoutInfo);
});






