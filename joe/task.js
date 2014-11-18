// Programmer: Doug Melville 
// Date: Nov 15, 2014
// File: index.js
// Purpose: a much cleaner implementation of our task manager using d3 fully

// files
const FILE_JSON = "demo.json";

// classes
const CLASS_Task = "taskRect";
const CLASS_TXT_Name = "taskName";
const CLASS_TXT_Description = "taskDescription";

// ids
const ID_PRFX_Task = "tsk";
const ID_Menu = "menu";
const ID_Canvas = "canvas";
const ID_HiddenRoot = "hiddenRoot";
const ID_BTN_Add = "BTN_add";
const ID_BTN_Edit = "BTN_edit";
const ID_BTN_Delete = "BTN_delete";

// padding
const PAD_Menu_X = 25;
const PAD_Menu_Y = 25;
const PAD_Text_X = 50;
const PAD_Text_Y = 50;
const PAD_Buttons = 10;

// Duration
const DUR_Update = 200;
const DUR_Enter = 200;

// Dimensions
const WIDTH_Canvas = 1240;
const HEIGHT_Canvas = 700;
const HEIGHT_Buttons = 50;

// Test
const TEXT_SIZE_Labels = 32;

var taskTree = null;
var canvas = null;
var selectedData = null;
var addColor;
var maxId = 5;

function addWheel(){
 var acw = Raphael.colorwheel($("#colorWheel")[0],100);
 var temp = acw.color;

 var setColor = function(){
     addColor = temp();
     console.log("addColor: ",addColor);
 }

 acw.ondrag(setColor,setColor);
 acw.input($("#wheelText")[0]);
}

function addButtons(){
	var buttonWidth = (WIDTH_Canvas / 3) - (2 * PAD_Buttons);

	d3.select("body").append("button")
	.attr("id", ID_BTN_Add)
	.style("position", "relative")
	.style("left", "0px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("add")
	.on("click", function(){myAdd(selectedData);});

	d3.select("body").append("button")
	.attr("id", ID_BTN_Edit)
	.style("position", "relative")
	.style("left", 3*PAD_Buttons+"px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("edit")
	.on("click", function(){myEdit(selectedData);});

	d3.select("body").append("button")
	.attr("id", ID_BTN_Delete)
	.style("position", "relative")
	.style("left", 6*PAD_Buttons+"px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("delete")
	.on("click", function(){myDelete(selectedData);});
}

function updateSelectedData(d){
	// lets us animate the selected node
	if(selectedData){
		d3.select("#" + ID_PRFX_Task + selectedData.id).select("rect")
		.attr("opacity", "1");
	}
	selectedData = d;
	d3.select("#" + ID_PRFX_Task + selectedData.id).select("rect")
	.attr("opacity", "0.7");
}

function zoomTo(d, duration){
	// remove the menu if we're giving up on editing for some reason
	var menu = d3.select("#" + ID_Menu);
	if(menu){
		menu.remove();
	}

	x.domain([d.x, d.x + d.dx]);
	y.domain([d.y, 1]).range([d.y ? 50 : 0, HEIGHT_Canvas]);

	rects = d3.select("#"+ID_Canvas).selectAll("rect");
	rects.transition()
	.duration(duration)
	.attr("x_old", function(d) { return d.x; })
	.attr("y_old", function(d) { return d.y; })
	.attr("x", function(d) { return x(d.x); })
	.attr("y", function(d) { return y(d.y); })
	.attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
	.attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });

	d3.selectAll("."+CLASS_TXT_Name).transition().duration(duration)
	.attr("user-select", "none")
	.attr("x_old", function(d) { return d.x; })
	.attr("y_old", function(d) { return d.y; })
	.attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + PAD_Text_Y; })
	.attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });

	d3.selectAll("."+CLASS_TXT_Description).transition().duration(duration)
	.attr("user-select", "none")
	.attr("x_old", function(d) { return d.x; })
	.attr("y_old", function(d) { return d.y; })
	.attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
	.attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });
}

function onDblclick_TaskRect(d){
	zoomTo(d, 250);
}

// for partitioning
var x = d3.scale.linear().range([0, WIDTH_Canvas]);
var y = d3.scale.linear().range([0, HEIGHT_Canvas]);
var color = d3.scale.category20c();
var partition = d3.layout.partition()
	.children(function(d) { return d.children; })
	.value(function(d) { return 1; })
	.sort(null);

function drawTree(c, t){
	var s = d3.select("#"+ID_Canvas).selectAll("g").data(t, function(d){return d.id;});
	// x and y -> group transform
	// width and height -> manual

	// make sure that we have the right unzoomed domains
	x = d3.scale.linear().range([0, WIDTH_Canvas]);
	y = d3.scale.linear().range([0, HEIGHT_Canvas]);

	// update
	s.select("rect").transition().duration(DUR_Update)
    .attr("x", function(d){ return x(d.x); })
    .attr("y", function(d){ return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    .attr("fill", function(d) { return color(d.color ? d.color : "blue"); });

    s.select("." + CLASS_TXT_Name).transition().duration(DUR_Update)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){ return d.name; });

    s.select("." + CLASS_TXT_Description).transition().duration(DUR_Update)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){ return d.description; });


	// enter
	g = s.enter().append("g")
	.attr("id", function(d){ return (ID_PRFX_Task + d.id); })
    
    g.append("rect")
    .on("click", function(d){updateSelectedData(d);})
    .on("dblclick", onDblclick_TaskRect)
    .attr("class", CLASS_Task)
    .attr("x", function(d){ return x(d.x); })
    .attr("y", function(d){ return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); })
    .attr("fill", function(d) { return color(d.color ? d.color : "blue"); });

    g.append("text")
    .attr("class", CLASS_TXT_Name)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){ return d.name; })
    .attr("pointer-events", "none");

    g.append("text")
    .attr("class", CLASS_TXT_Description)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){ return d.description; })
    .attr("pointer-events", "none");

    // exit
    s.exit().remove();
}

function newTask(){
	maxId = maxId + 1;
	return {
		"id":maxId,
		"name":"title",
		"description":"description",
		"children":[]
	};
}

function updateFromForm(d){
        var newName = document.getElementById("titleInput").value;
        var newDetails = document.getElementById("desTextArea").value;

        newName ? d.name = newName : console.log("Name didn't change.");
        newDetails ? d.description = newDetails: console.log("Details didn't change.");
        addColor ? d3.select("#" + ID_PRFX_Task + selectedData.id).select("rect").attr("fill",addColor.toString()) : console.log("Color didn't change.");
        if(newName && newDetails && addColor){
		console.log("Something Changed");
	}else{
		console.log("Nothing Changed");
		d3.select("#menu").remove();
		return
	}
	drawTree(canvas, partition(taskTree));
        d3.select("#menu").remove(); 
	zoomTo(d, DUR_Update);
}

function showForm(d){
	// show the form
	var form = d3.select("#" + ID_PRFX_Task + d.id).append("foreignObject")
	.attr("id", ID_Menu)
	.attr("x", x(d.x) + PAD_Menu_X)
	.attr("y", y(d.y) + PAD_Menu_Y)
	.attr("width", 475)
	.attr("height", 325)
	.append("xhtml:body")
	.append("form");

	form.append("input")
	.attr("id", "titleInput")
	.attr("type", "text")
	.attr("size", 14)
	.attr("placeholder", d.name)
	.style("font-size", "32px");

	form.append("textarea")
	.attr("id", "desTextArea")
	.attr("rows", 3)
	.attr("cols", 13)
	.attr("placeholder", d.description)
	.attr("wrap", "hard")
	.style("font-size", "32px");

	form.append("input")
	.attr("type", "button")
	.attr("value", "OK")
	.on("click", updateFromForm, d);

        form.append("div")
        .attr("id", "colorWheel")
        .attr("x", 0)
        .attr("y", 0)
        .attr("position","absolute");

        form.append("input")
        .attr("size","7")
        .attr("type","text")
        .attr("id","wheelText")
        .attr("x", 425)
        .attr("y", 100)
        .attr("position","absolute");
        addWheel();
}

function myAdd(d){
	if(!d.children){
		d.children = [];
	}
	n = newTask();
	d.children.push(n);

	drawTree(canvas, partition(taskTree));
}

function myEdit(d){
	zoomTo(d, 750);
	setTimeout(function(){showForm(d);}, 760);
}

function myDelete(d){
	// repair parent pointers
	var siblings = d.parent.children;
	if(d.children){
		d.children.forEach(function(e, i){
			e.parent = d.parent;
			siblings.push(e);
		});
	}
	// TODO: Could cause a memory leak if we don't free ourselves or get caught in garbage collection?
	// IMPORTANT: d.parent never null since we can't delete the hidden root
	var myIndex = siblings.indexOf(d);
	siblings.splice(myIndex, 1);
	selectedData = null;

	drawTree(canvas, partition(taskTree));
}

function createCanvas(){
	var localCanvas = d3.select("body").append("svg")
		.attr("width", WIDTH_Canvas)
		.attr("height", HEIGHT_Canvas)
		.attr("id", ID_Canvas)
		.attr("display", "block");

	return localCanvas;
}

$(document).ready(function(){
	// generate the buttons
	addButtons();

	// startup run
	d3.json(FILE_JSON, function(error, root){
	  canvas = createCanvas();
	  taskTree = root;
	  // TODO: How come we have to partition out here and not in the function?!
	  drawTree(canvas, partition(taskTree));
	  updateSelectedData(taskTree);
	});
});




