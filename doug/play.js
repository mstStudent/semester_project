d3.select("body").append("svg").append("g").append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", 1)
.attr("height", 0.333)
.attr("fill", "black");

d3.select("svg")
.attr("height", 700)
.attr("width", 1240)

d3.select("body").select("svg").select("g")
.attr("transform", "translate(5,5)scale(1024,700)");