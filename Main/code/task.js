// Programmers: Doug Melville , Joseph Pantoga, Sean Dickey 
// Date: Nov 15, 2014
// File: index.js
// Purpose: a much cleaner implementation of our task manager using d3 fully

// files
const FILE_JSON = "demo.json";

// classes
const CLASS_Task = "taskRect";
const CLASS_TXT_Name = "taskName";
const CLASS_TXT_Description = "taskDescription";
const CLASS_PERCENT_DONE = "percentDescription"

// ids
const ID_PRFX_Task = "tsk";
const ID_Menu = "menu";
const ID_Canvas = "canvas";
const ID_HiddenRoot = "hiddenRoot";
const ID_BTN_Add = "BTN_add";
const ID_BTN_Edit = "BTN_edit";
const ID_BTN_Delete = "BTN_delete";

// padding
const NUM_Buttons = 4;
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
const TEXT_SIZE_Labels = 48;

// Default Rect Color
const DEF_COLOR = "blue"

var taskTree = null;
var canvas = null;
var selectedData = null;
var addColor;
var percentDone;
var percentDoneSlider;
var maxId = 5;
var zoomedTo = null;
var formVisible = false;

var colorWheel = null;

//Script for the "Save" button
var saveAddAllData = function () {
    if ($("#jsonArea").text() === '') {
        addAllData();
    }
}

function addSlider(startingPercent){
        var elem = document.querySelector("#slider");
        percentDoneSlider = new Powerange(elem,{ 
		min: 0, 
		max: 100, 
		start: startingPercent,
		callback: function(){
			$("#slider").val() != '100'? $("#percentage").html($("#slider").val()+'% Completed'):$("#percentage").html('Task Completed')
			}
		});
}

function addWheel(){
	colorWheel = Raphael.colorwheel($("#colorWheel")[0], 100);
	colorWheel.input($("#wheelText")[0]);
}

var addTabs = function(numTabs){
    for (var i = 0; i <= numTabs; i++) {
        $("#jsonArea").append('\t');
    }
}

function updateTextBox(data, tabs) {
	// this prints nicely formatted JSON! :)
    addTabs(tabs);
    $("#jsonArea").append('\"id\":'+data.id+',\n');
    addTabs(tabs);
    $("#jsonArea").append('\"name\":\"'+data.name+'\",\n');
    if(data.description){
      addTabs(tabs);
      $("#jsonArea").append('\"description\":\"'+data.description+'\",\n');
    }
    if(data.percent){
      addTabs(tabs);
      $("#jsonArea").append('\"percent\": '+data.percent+',\n');
    }
    if(data.color){
	addTabs(tabs);
	$("#jsonArea").append('\"color\": \"'+data.color+'\",\n');
    }
    addTabs(tabs);
    $("#jsonArea").append('\"children\":[');
    if (data.children && data.children.length > 0) {
        $("#jsonArea").append('\n');
        data.children.forEach(function (child, index) {
            addTabs(tabs);
            $("#jsonArea").append('{\n');
            updateTextBox(child, tabs + 1);
            addTabs(tabs);
            $("#jsonArea").append('}');
            if (index < child.parent.children.length - 1) {
                    $("#jsonArea").append(',');
            }
            $("#jsonArea").append('\n');
        });
        addTabs(tabs);
    }
    $("#jsonArea").append(']\n');
}

function addAllData() {
    $("#jsonArea").text('');
    $("#jsonArea").append('{\n');
    updateTextBox(taskTree,1);
    $("#jsonArea").append('\n}');
}

function addButtons(){
	var buttonWidth = ((WIDTH_Canvas-((NUM_Buttons - 1) * PAD_Buttons)) / NUM_Buttons);

    d3.select("body").append("button")
.attr("id", "goHome")
.style("position", "absolute")
.style("left", 3*buttonWidth + 4*PAD_Buttons + "px")
.style("top", "0px")
.style("width", buttonWidth + "px")
.style("height", HEIGHT_Buttons + "px")
.text("Home")
.on("click", function () { window.location.replace('http://localhost:5000') });

	d3.select("body").append("button")
	.attr("id", ID_BTN_Add)
	.style("position", "absolute")
	.style("left", PAD_Buttons+"px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("add")
	.on("click", function(){myAdd(selectedData);});

	d3.select("body").append("button")
	.attr("id", ID_BTN_Edit)
	.style("position", "absolute")
	.style("left", buttonWidth + 2*PAD_Buttons + "px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("edit")
	.on("click", function(){myEdit(selectedData);});

	d3.select("body").append("button")
	.attr("id", ID_BTN_Delete)
	.style("position", "absolute")
	.style("left", 2*buttonWidth + 3*PAD_Buttons+"px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("delete")
	.on("click", function () { myDelete(selectedData); });

/* Uncomment if you need to debug json printing.
	d3.select("body").append("button")
	.attr("id", "giveMeJson")
	.style("position", "absolute")
	.style("left", 3*buttonWidth + 4*PAD_Buttons + "px")
	.style("top", "0px")
	.style("width", buttonWidth + "px")
	.style("height", HEIGHT_Buttons + "px")
	.text("Print Json")
	.on("click", function () { addAllData(); });
*/
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

function zoomTo(d, duration, heightMod){
	// added hacky heightMod variable to allow us to zoom to different heights
	// TODO: Fix this so it isn't awful
	var heightDomain = 1;
	if(heightMod){
		heightDomain = d.y + d.dy;
	}

	// remove the menu if we're giving up on editing for some reason
	var menu = d3.select("#" + ID_Menu);
	if(menu){
		menu.remove();
		formVisible = false;
	}

	x.domain([d.x, d.x + d.dx]);
	y.domain([d.y, heightDomain]).range([d.y ? 50 : 0, HEIGHT_Canvas]);

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

        d3.selectAll("."+CLASS_PERCENT_DONE).transition().duration(duration)
        .attr("user-select", "none")
        .attr("x_old", function(d) { return d.x; })
        .attr("y_old", function(d) { return d.y; })
        .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
        .attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
        .attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });

	zoomedTo = d;
}

function onDblclick_TaskRect(d){
	zoomTo(d, 250, false);
	updateSelectedData(d);
}

// for partitioning
var x = d3.scale.linear().range([0, WIDTH_Canvas]);
var y = d3.scale.linear().range([0, HEIGHT_Canvas]);
// var color = d3.scale.category20c();
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
    .attr("height", function(d) { return y(d.dy); });

    // TODO: Figure out why this won't transition anymore?
    s.select("rect").attr("fill", function(d) { return d.color ? d.color : DEF_COLOR });

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

    s.select("." + CLASS_PERCENT_DONE).transition().duration(DUR_Update)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
        .attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){ 
     return d.percent ? d.percent+'% Completed' : "0% Completed";
     });

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
    .attr("fill", function(d) { return (d.color ? d.color : DEF_COLOR); });

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

    g.append("text")
    .attr("class", CLASS_PERCENT_DONE)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
    .attr("font-size", function(d){return d.dx*TEXT_SIZE_Labels; })
    .text(function(d){
	  return d.percent ? d.percent+'% Completed' : "0% Completed";
	 })
    .attr("pointer-events", "none");


    // exit
    s.exit().remove();
    addAllData();
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
    d.name = document.getElementById("titleInput").value;
    d.description = document.getElementById("desTextArea").value;
    d.percent = $("#slider").val();
    d.color = colorWheel.color();
    drawTree(canvas, partition(taskTree));
    zoomTo(d, DUR_Update, false);
    d3.selectAll("text").attr("display","");
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
	.attr("value", d.name)
	.style("font-size", "32px");

	form.append("textarea")
	.attr("id", "desTextArea")
	.attr("rows", 3)
	.attr("cols", 13)
	.attr("value", d.description)
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

    form.append("input")
    .attr("id", "slider")
    .attr("type","text")
    .attr("x", 0)
    .attr("y", 0);

    form.append("div")
    .attr("id", "percentage")
    .attr("x", 0)
    .attr("y", 0);

    if(d.percent){
       addSlider(d.percent);
    }else{
       addSlider(0);
    }

    addWheel();
    if(selectedData.color){
       colorWheel.color(selectedData.color);
    }else{
       colorWheel.color(d3.select("#" + ID_PRFX_Task + selectedData.id).select("rect").attr("fill"));
    }
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
	if(!formVisible){
		zoomTo(d, 750, true);
		setTimeout(function(){
		        d3.selectAll("text").attr("display","none");
			showForm(d);
			}, 760);
	}
	formVisible = true;
}

function myDelete(d){
	var menu = d3.select("#" + ID_Menu);
	if(menu){
		menu.remove();
		formVisible = false;
	}

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
	.style("position", "absolute")
	.style("left", PAD_Buttons + "px")
	.style("top", HEIGHT_Buttons+PAD_Buttons+"px")
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
	$("#jsonOverRide").click(function(){
		var newJson;
                var isJSON = true;
                try{
			newJson = jQuery.parseJSON($("#jsonArea").val());
		}
		catch(err){
			alert("Error: That is not a JSON object!")
                        console.log("Parsing TEXT: ",newJson);
                        console.log("Parsing Error: ",err);
			isJSON = false;
		}
		if(isJSON){
			try{
				drawTree(canvas,partition(newJson));
				taskTree = jQuery.parseJSON($("#jsonArea").val());
			}
			catch(err){
				alert("Error: That is an invalid JSON Object!");
	                        console.log("ATTEMPTED TO PARTITION: ",newJson);
                                console.log("PARTITION ERROR: ",err);
			}
		}
	});
});
