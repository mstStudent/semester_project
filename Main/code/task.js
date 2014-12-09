// Programmers: Doug Melville , Joseph Pantoga, Sean Dickey 
// Date: Nov 15, 2014
// File: index.js
// Purpose: Task manager using d3 and javascript w/jquery

// Json file to initally read.
// TODO: Allow users to upload their own json item either via the text box or a load file function.
const FILE_JSON = "default.json";

// HTML classes that d3 needs to handle a lot. (there are a few classes not here that are used but d3 doesn't deal with them as much)
// TODO: Review if we really need these four consts since they are really only used twice.
const CLASS_Task = "taskRect"; // rectangles
const CLASS_TXT_Name = "taskName"; // The "title"
const CLASS_TXT_Description = "taskDescription"; // um...name should say it all
const CLASS_PERCENT_DONE = "percentDescription"; // This is for the text portion of the slider 
const CLASS_ClipPath = "cpath";

// ids, NOTE: Not all ids are here but these are the main ones d3 deal with
const ID_PRFX_Task = "tsk";
const ID_PRFX_TaskRect = "tskRect";
const ID_PRFX_ClipRect = "clpPath";
const ID_Menu = "menu";
const ID_Canvas = "canvas";
const ID_HiddenRoot = "hiddenRoot";
const ID_BTN_Add = "BTN_add";
const ID_BTN_Edit = "BTN_edit";
const ID_BTN_Delete = "BTN_delete";

// padding; d3 can apply these to each rec so we don't need to worry about this in the css file.
const NUM_Buttons = 4;
const PAD_Menu_X = 25;
const PAD_Menu_Y = 25;
const PAD_Text_X = 50;
const PAD_Text_Y = 50;
//now in css file
//const PAD_Buttons = 10;

// Duration, used in transitions
const DUR_Update = 200;
const DUR_Enter = 200;

// Dimensions
const WIDTH_Canvas = 1240;
const HEIGHT_Canvas = 700;
//Now in the CSS File
//const HEIGHT_Buttons = 50;

// Text properties
const TEXT_SIZE_Labels = 48;

// Default Rect Color
const DEF_COLOR = "blue"

/*
  Global vars that we need throughout the program.
*/
var taskTree = null; // THIS IS THE JSON OBJECT DO NOT REMOVE!
var canvas = null;  // This is the canvas that everything is drawn on
var selectedData = null; // Rect user selected
// Max id is only good with the default json file. Id is also the unique property d3 uses to tell the rects appart.
// TODO: When users upload their json object we need to either dynamically assign ids to each item or count the id's.
var maxId = 0;
// Are we zooming in/zoomed in?
var zoomedTo = null;
// is the form displayed?
var formVisible = false;
// This will eventually map to the color wheel in the selected object
var colorWheel = null;

//  NOW OBSOLETE  \\
//Script for the "Save" button
var saveAddAllData = function () {
    // If statment is not needed since we have jsonArea update on ever button click, but I'll keep it here just in case.
    if ($("#jsonArea").text() === '') {
        addAllData();
    }
    console.log("Saved Data");
}

// Does what the function name implies. startingPercent var also is what it implies
// NOTE: Slider may or maynot survive the next set of updates we make. (The slider might be replaced or removed)
function addSlider(startingPercent){
        var elem = document.querySelector("#slider"); // Not sure why powerange needs the element to be from querySelector but I'm just rolling with it.
        // Slider object defined, no need to have any variable to track it, since everything is setup in the callback options.
        new Powerange(elem,{ 
		min: 0, 
		max: 100, 
		start: startingPercent,
		callback: function(){
			// Basically if the slider value is not 100 print the % otherwise print 'Task Completed'
			$("#slider").val() != '100'? $("#percentage").html($("#slider").val()+'% Completed'):$("#percentage").html('Task Completed')
			}
		});
}

// Simply defines the color wheel and tells the color wheel if it has an input object to print to.
function addWheel(){
	colorWheel = Raphael.colorwheel($("#colorWheel")[0], 100); // Object def
	colorWheel.input($("#wheelText")[0]); // Tells color wheel to print to this input obj.
}

// TODO: There should be a better way to do this but this was the first thing that came to me.
// It just adds the tab character to the jsonArea object.
var addTabs = function(numTabs){
    for (var i = 0; i <= numTabs; i++) {
        $("#jsonArea").append('\t');
    }
}

// Recursivly add all of taskTree as a string in the jsonArea
// TODO: I found a bug, back when we had a button to call this function that if you try to do this enough times then this recursion stops working correctly.
/*
	GENERAL FORMAT (*'s mean it's required)
	{
		"id": num,*
		"name": string,*
		"description": string,
		"percent": num,
		"color": string (either color name or hex num),
		"children: []* (if there are children just repeat the pattern in the children array.)
	}

*/

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
// Printing the json starts here!
function addAllData() {
    $("#jsonArea").text('');
    $("#jsonArea").append('{\n');
    updateTextBox(taskTree,1);
    $("#jsonArea").append('\n}');
}

// Tell d3 to add the 4 buttons; where they should be and other properties that they need.
// TODO: Rearrange the buttons in the code to reflect the botton arrangement users will see.
function addButtons(){
	//Use the CSS file
  //var buttonWidth = ((WIDTH_Canvas-((NUM_Buttons - 1) * PAD_Buttons)) / NUM_Buttons);

    d3.select("#navBar").append("button")
	.attr("id", "goHome")
  .attr("class", "navButton")
	.text("Home")
	.on("click", function () { window.location.replace('../../') });

    d3.select("#navBar").append("button")
	.attr("id", ID_BTN_Add)
  .attr("class", "navButton")
	.text("add")
	.on("click", function(){myAdd(selectedData);});

    d3.select("#navBar").append("button")
	.attr("id", ID_BTN_Edit)
  .attr("class", "navButton")
	.text("edit")
	.on("click", function(){myEdit(selectedData);});

    d3.select("#navBar").append("button")
	.attr("id", ID_BTN_Delete)
  .attr("class", "navButton")
	.text("delete")
	.on("click", function () { myDelete(selectedData); });

/* Uncomment if you need to debug json printing.
	 It just prints the json to jsonArea but every button now does that.
	d3.select("#taskArea").append("button")
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

// Just updated a global var and makes rect "lighter" to let users know they selected a rect.
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

// Function name should explain it's overall functionality.
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

	/*
	 d3 magic happens here to "zoom" in to the selected rect.
	*/

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
	//.attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });

	d3.selectAll("."+CLASS_TXT_Description).transition().duration(duration)
	.attr("user-select", "none")
	.attr("x_old", function(d) { return d.x; })
	.attr("y_old", function(d) { return d.y; })
	.attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
	//.attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });

	d3.selectAll("."+CLASS_PERCENT_DONE).transition().duration(duration)
	.attr("user-select", "none")
	.attr("x_old", function(d) { return d.x; })
	.attr("y_old", function(d) { return d.y; })
	.attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
	//.attr("font-size", function(d){return ((x(d.x + d.dx) - x(d.x))/WIDTH_Canvas)*TEXT_SIZE_Labels; });

	zoomedTo = d;
}

// What happens when you double click a rect.
function onDblclick_TaskRect(d){
	zoomTo(d, 250, false);
	updateSelectedData(d);
}

// for partitioning
var x = d3.scale.linear().range([0, WIDTH_Canvas]);
var y = d3.scale.linear().range([0, HEIGHT_Canvas]);
// Why did we remove the color var?
// var color = d3.scale.category20c();

// More d3 magic DON'T TOUCH!
var partition = d3.layout.partition()
	.children(function(d) { return d.children; })
	.value(function(d) { return 1; })
	.sort(null);

// Draws the chart from json object. The most called function here other than maybe addAllData()
function drawTree(c, t){
	var s = d3.select("#"+ID_Canvas).selectAll("g").data(t, function(d){ return d.id; });
	var c = d3.select("#"+ID_Canvas).select("defs").selectAll("."+CLASS_ClipPath).data(t, function(d){ return d.id; });
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
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){ return d.name; });

    s.select("." + CLASS_TXT_Description).transition().duration(DUR_Update)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
	.attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){ return d.description; });

    s.select("." + CLASS_PERCENT_DONE).transition().duration(DUR_Update)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){ 
     return d.percent ? d.percent+'% Completed' : "0% Completed";
     });

    c.select("rect").transition().duration(DUR_Update)
    .attr("x", function(d){ return x(d.x); })
    .attr("y", function(d){ return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); });

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
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){ return d.name; })
    .attr("pointer-events", "none")
    .style("user-select", "none")
    .style("webkit-user-select", "none");

    g.append("text")
    .attr("class", CLASS_TXT_Description)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + 2*PAD_Text_Y; })
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){ return d.description; })
    .attr("pointer-events", "none")
    .style("user-select", "none")
    .style("webkit-user-select", "none");

    g.append("text")
    .attr("class", CLASS_PERCENT_DONE)
    .attr("x", function(d) { return x(d.x) + PAD_Text_X; })
    .attr("y", function(d) { return y(d.y) + 4*PAD_Text_Y; })
    .attr("font-size", function(d){return TEXT_SIZE_Labels; })
    .text(function(d){
	  return d.percent ? d.percent+'% Completed' : "0% Completed";
	 })
    .attr("pointer-events", "none")
    .style("user-select", "none")
    .style("webkit-user-select", "none");

    c.enter().append("clipPath")
    .attr("id", function(d){ return (ID_PRFX_ClipRect + d.id); })
    .attr("class", CLASS_ClipPath)
    .append("rect")
    .attr("x", function(d){ return x(d.x); })
    .attr("y", function(d){ return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    .attr("height", function(d) { return y(d.dy); });

    g.style("clip-path", function(d){ return "url(#"+ID_PRFX_ClipRect+d.id+")"; });

    // exit
    s.exit().remove();
    c.exit().remove();

    // Print json to jsonArea, It's easier/lazier to check if it's right if everytime it's drawn it's updated.
    // addAllData();
}

// Default task settings.
// TODO: Allow users to provide this data upon adding vs having to add then edit.
function newTask(){
	maxId = maxId + 1;
	return {
		"id":maxId,
		"name":"title",
		"description":"description",
		"children":[]
	};
}

// Again name should give it away.
// var d is actually the selected rect data.
function updateFromForm(d){
	// Read from text boxes
    d.name = document.getElementById("titleInput").value;
    d.description = document.getElementById("desTextArea").value;
	// Get slider info
    d.percent = $("#slider").val();
	// Get color wheel data, this is where the global var comes in handy
    d.color = colorWheel.color();
	// Redraw the tree
    drawTree(canvas, partition(taskTree));
	// Due to some "fun bugs" we need to rezoom to the spot. Doug is that right?
    zoomTo(d, DUR_Update, false);
	// After editing unhide all the text.
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
	.append("xhtml:taskArea")
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
	.html(d.description)
	.attr("wrap", "hard")
	.style("font-size", "32px");

	form.append("input")
	.attr("type", "button")
	.attr("value", "OK")
	.on("click", updateFromForm, d);
	// Add color wheel spot holder div and it's input box
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

	// Add slider's spot holder, it needs an input box. It really just hides this later and puts the slider directly below the spot of the input box (unless css rules say otherwise)
    form.append("input")
    .attr("id", "slider")
    .attr("type","text")
    .attr("x", 0)
    .attr("y", 0);
	// Text for progress
    form.append("div")
    .attr("id", "percentage")
    .attr("x", 0)
    .attr("y", 0);
	// If d (rect selected by d3 at this moment) has % data print it otherwise it's 0 
    if(d.percent){
       addSlider(d.percent);
    }else{
       addSlider(0);
    }

	// Set up wheel, if the selected rect has a color print that otherwise find out what it is.
    addWheel();
    if(selectedData.color){
       colorWheel.color(selectedData.color);
    }else{
       colorWheel.color(d3.select("#" + ID_PRFX_Task + selectedData.id).select("rect").attr("fill"));
    }
}

// Add rect to chart and another object to taskTree.
function myAdd(d){
	if(!d.children){
		d.children = [];
	}
	n = newTask();
	d.children.push(n);
	drawTree(canvas, partition(taskTree));
	zoomTo(d, DUR_Update, 0);
}

// Edit selected rects data
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

// Delete rect.
// TODO: We need to do some more tests on this and check it visually.
// NOTE: d3 can do some "funny" things with the chart when we delete things
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
	var localCanvas = d3.select("#taskArea").append("svg")
	.attr("width", WIDTH_Canvas)
	.attr("height", HEIGHT_Canvas)
	.attr("id", ID_Canvas)
	.attr("display", "block")
	.append("defs");
	return localCanvas;
}

function getMaxId(t, currentMax){
	if(t.children){
		t.children.forEach(function(e, i){
			currentMax = getMaxId(e, currentMax);
		});
	}
	if(t.id > currentMax){
		currentMax = t.id;
	}
	return currentMax;
}

// This block basically starts this and checks if any condtional items are meet.
$(document).ready(function(){
	// generate the buttons
	addButtons();

	// startup run
	d3.json(FILE_JSON, function(error, root){
	  canvas = createCanvas();
	  taskTree = root;
	  // TODO: How come we have to partition out here and not in the function?!
	  drawTree(canvas, partition(taskTree));
	  maxId = getMaxId(taskTree, 0);
	  updateSelectedData(taskTree);
	});

// THIS ISN'T USED RIGHT NOW, Joe had a "Read From TextBox" button but removed it. Might add it back in before the demo.
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
