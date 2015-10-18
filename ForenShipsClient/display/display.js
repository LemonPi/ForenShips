"use strict";

var textbody;
var interface_container;
var active_chart;

// tooltip
var time_tooltip_format = d3.time.format("%a %I:%M%p");
var tip;

var serverData;

// var API_ENDPOINT = "http://forenships.co/diagnose";
var API_ENDPOINT = "http://localhost:8000/diagnose";
// var API_ENDPOINT = "http://localhost:8080/sampleout.json";	// sample data

function epochTimeConverter(unixEpochTime) {
    return new Date(unixEpochTime);
}
function epoch_to_date(data) {
	for (var i = 0; i < data.length; ++i) {
		data[i][0] = epochTimeConverter(data[i][0]);
	}	
}
function toXYObj(o) {
	return {x: o[0], y: o[1], size: o[2].length, body: o[2]};
}
function legend() {
	var w = 18;
    var h = 18;
    var cppx = 6;
    var padding = 8;

    // generate chart there
    function lg(svg, labels) {
	    var legend = svg.append("g");
	    var prev_width = 0;
	    for (var i = 0; i < labels.length; ++i) {
	    	var cell = legend.append("g")
	    		.attr("attr","cell")
	    		.attr("transform", "translate("+prev_width+",0)");

	    	prev_width += w + cppx*labels[i][1].length + padding + 4;

	    	cell.append("circle")
	    		.attr("class", labels[i][0])
	    		.attr("cx",w/2+2)
	    		.attr("cy",h/2+2)
	    		.attr("r", h/2);
	    		// .attr("width", w)

	    	cell.append("text")
	    		.attr("class", "legend-text")
	    		.attr("transform", "translate("+ (padding/2 + w + cppx*labels[i][1].length/2) +",15)")
	    		.attr("text-anchor", "middle")
	    		.text(labels[i][1]);

	    }	
    	return legend;
    }

    lg.w = function(value) {
    	if (!arguments.length) return w;
    	w = value;
    	return lg;
    }
    lg.h = function(value) {
    	if (!arguments.length) return h;
    	h = value;
    	return lg;
    }
    lg.padding = function(value) {
    	if (!arguments.length) return padding;
    	padding = value;
    	return lg;
    }

    return lg;

}

function chart() {
	var w = 680;
	var h = 500;
	var padding = 40;

	var ylabel = "";

	var xdomain = [0,1];
	var ydomain = [0,1];

	var yrange = [0,1];

	var xscale;
	var yscale;

	var xaxis;
	var yaxis;

	var actual_xaxis;
	var actual_yaxis;

	var svg;

    var redraw_chart = function() {
    	svg.selectAll(".point")
    		.attr("cx", function(d){return xscale(d[0]);});
    }

	function ch(svgselection) {
		svg = d3.select(svgselection)
            .attr("width", w) 
            .attr("height", h);
        // scales (y between 0 - 1) (x is time)
        yscale = d3.scale.linear()
        	.domain(ydomain)
        	.range([h-padding,padding]);

        xscale = d3.time.scale()
        	.domain(xdomain)
        	.range([padding,w-padding]);

        // axes
        xaxis = d3.svg.axis()
        	.scale(xscale)
        	.orient("bottom")
        	.innerTickSize(-h+2*padding)
        	.ticks(5);

        yaxis = d3.svg.axis()
        	.scale(yscale)
        	.innerTickSize(-w+2*padding)
        	.orient("left");

       	// axis labels
       	svg.append("text")
       		.attr("text-anchor","middle")
       		.attr("transform", "translate("+ 1.2*padding +"," + (1.4*padding + 2.6*ylabel.length) +"),rotate(90)")
       		.text(ylabel);

        return svg;
	}
	ch.draw_axis = function() {
        actual_xaxis = svg.append("g")
	        .attr("class", "axis")
	        .attr("transform", "translate(0," + (h-padding) + ")")
        	.call(xaxis);
        actual_yaxis = svg.append("g")
        	.attr("class", "axis")
        	.attr("transform", "translate(" + padding + ",0)")
        	.call(yaxis);	
        // zoom on x axis
        var xzoom = d3.behavior.zoom()
        	.x(xscale)
        	.scaleExtent([1,100000])
        	.on("zoom", function() {
        		actual_xaxis.call(xaxis);
        		redraw_chart();
        	});
        xzoom(svg);
	}
    ch.w = function(value) {
    	if (!arguments.length) return w;
    	w = value;
    	return ch;
    }
    ch.h = function(value) {
    	if (!arguments.length) return h;
    	h = value;
    	return ch;
    }
    ch.padding = function(value) {
    	if (!arguments.length) return padding;
    	padding = value;
    	return ch;
    }
    ch.xdomain = function(value) {
    	if (!arguments.length) return xdomain;
    	xdomain = value;
    	return ch;
    }
    ch.ydomain = function(value) {
    	if (!arguments.length) return ydomain;
    	ydomain = value;
    	return ch;
    }
    ch.xscale = function(value) {
    	if (!arguments.length) return xscale;
    	xscale = value;
    	return ch;
    }    
    ch.yscale = function(value) {
    	if (!arguments.length) return yscale;
    	yscale = value;
    	return ch;
    }     
    ch.ylabel = function(value) {
    	if (!arguments.length) return ylabel;
    	ylabel = value;
    	return ch;
    } 
    ch.redraw_chart = function(value) {
    	if (!arguments.length) return redraw_chart;
    	redraw_chart = value;
    	return ch;
    }

    return ch;
}

function addGraph(datain) {
	var chart_sentiments = $($(interface_container).find('#chart')[0]);
	chart_sentiments.removeClass("hidden-chart");
	if (chart_sentiments.attr("data-created")) {
		console.log("graph already built, toggle visibility");
		// already exists, just change visibilities
	}
	else {
		console.log("creating new graph");

		var mine = serverData.data[0];
		var them = serverData.data[1];
		epoch_to_date(mine);
		epoch_to_date(them);

        var xdomain = [Math.min(them[0][0],mine[0][0]), Math.max(them[them.length-1][0],mine[mine.length-1][0])];

        var my_chart = chart()
        	.xdomain(xdomain)
        	.ylabel("sentiment");
        // generate chart (without data)
        var svg = my_chart("#chart svg");

        var xscale = my_chart.xscale();
        var yscale = my_chart.yscale();

        var sentmsg = svg.selectAll(".sentmsg")
        	.data(mine)
        	.enter()
        	.append("circle")
        	.attr("class", "mine point")	// my points
        	.attr("cx", function(d) {return xscale(d[0]);})
        	.attr("cy", function(d) {return yscale(d[1]);})
        	.attr("r", function(d) {return d[2].length * 0.04;})
        	.on("mouseover", function(d){
        		// make tool tip
        		tip.style("visibility","visible");
        		tip.html(time_tooltip_format(d[0]))
        			.style("left", d3.event.pageX + 20 + "px")
        			.style("top", (d3.event.pageY - 10) + "px");
        		// populate window
        		textbody.innerHTML = d[2].replace(/\n/g, "<br>");
        		textbody.className = "mymessage";
        		})
        	.on("mouseout", function(d) {tip.style("visibility","hidden");});

        var rsvdmsg = svg.selectAll(".rsvdmsg")
        	.data(them)
        	.enter()
        	.append("circle")
        	.attr("class", "their point")	// their points
        	.attr("cx", function(d) {return xscale(d[0]);})
        	.attr("cy", function(d) {return yscale(d[1]);})
        	.attr("r", function(d) {return d[2].length * 0.04;})
        	.on("mouseover", function(d){
        		// make tool tip
        		tip.style("visibility","visible");
        		tip.html(time_tooltip_format(d[0]))
        			.style("left", d3.event.pageX + 20 + "px")
        			.style("top", (d3.event.pageY - 10) + "px");
        		// populate window
        		textbody.innerHTML = d[2].replace(/\n/g, "<br>");
        		textbody.className = "";
        		})
        	.on("mouseout", function(d) {tip.style("visibility","hidden");});

        my_chart.draw_axis();

        // legend
        // first element are classes to append (to give colour) and second is text to display
        var labels = [["mine fauxpoint","sent"],["their fauxpoint","received"]];
        var my_legend = legend().padding(14);
        my_legend(svg,labels).attr("class", "legend").attr("transform", "translate(5,5)");

		chart_sentiments.attr("data-created", "true");
	}
	// hide the active chart if it's not this chart
	if (active_chart && active_chart.attr("id") != chart_sentiments.attr("id")) 
		active_chart.addClass("hidden-chart");
	active_chart = chart_sentiments;
}

function toBiasObj(o) {
	return {x: o[0], y: o[1]};
}
function addBiasGraph(datain) {
	var chart_bias = $($(interface_container).find('#chart_bias')[0]);
	chart_bias.removeClass("hidden-chart");
	if (chart_bias.attr("data-created")) {
		// already exists, just change visibilities
	}
	else {
		chart_bias.attr("data-created", "true");

        var biases = datain.bias;
		epoch_to_date(biases);
		var min_bias = biases[0][1];
		var max_bias = biases[0][1];
		for (var i = 1; i < biases.length; ++i) {
			if (biases[i][1] < min_bias)
				min_bias = biases[i][1];
			else if (biases[i][1] > max_bias)
				max_bias = biases[i][1];
		}
		min_bias = Math.floor(min_bias);
		max_bias = Math.ceil(max_bias);

        var my_chart = chart()
        	.ylabel("bias (positive means you try harder)")
        	.xdomain([biases[0][0], biases[biases.length-1][0]])
        	.ydomain([min_bias, max_bias]);
        // generate chart (without data)
        var svg = my_chart("#chart_bias svg");

        var xscale = my_chart.xscale();
        var yscale = my_chart.yscale();
        
        var totalbiases = svg.selectAll(".biaspts")
        	.data(biases)
        	.enter()
        	.append("circle")
        	.attr("class", "their point")	// my points
        	.attr("cx", function(d) {return xscale(d[0]);})
        	.attr("cy", function(d) {return yscale(d[1]);})
        	.attr("r", 4)
        	.on("mouseover", function(d){
        		// make tool tip
        		tip.style("visibility","visible");
        		tip.html(time_tooltip_format(d[0]) + " bias: <b>" + d[1].toFixed(2) +"</b>")
        			.style("left", d3.event.pageX + 20 + "px")
        			.style("top", (d3.event.pageY - 10) + "px");
        		})
        	.on("mouseout", function(d) {tip.style("visibility","hidden");});

        my_chart.draw_axis();

		var line_func = d3.svg.line()
        	.x(function(d){return xscale(d[0]);})
        	.y(function(d){return yscale(d[1]);})
        	.interpolate('linear');

        var line = svg.append("svg:path")
        	.attr("d", line_func(biases))
        	.attr("fill","none")
        	.attr("stroke-width", "2px")
        	.attr("stroke-opacity", "0.7")
        	.attr("stroke","#0099ff");

        // add in line modification for redrawing
        my_chart.redraw_chart(function() {
    		line.attr("transform", "translate(" + d3.event.translate[0] + ",1)scale(" + d3.event.scale + ",1)");
    		line.attr("stroke-width", Math.max(4e-5,3/d3.event.scale));
        	svg.selectAll(".point")
        		.attr("cx", function(d){return xscale(d[0]);});
        });

        // legend
        // first element are classes to append (to give colour) and second is text to display
        var labels = [["their fauxpoint", "relationship bias"]];
        var my_legend = legend().padding(14);
        my_legend(svg,labels).attr("class", "legend").attr("transform", "translate(5,5)");

		chart_bias.insertAfter(active_chart);
	}
	textbody.innerHTML = "";
	if (active_chart && active_chart.attr("id") != chart_bias.attr("id")) active_chart.addClass("hidden-chart");
	active_chart = chart_bias;
}

function loadedConversation(data) {
	$("#loading").hide();
	$("#interface-container").show();
	// console.log(data);
	$("#health-points").text(data.health_points);
	$("#relationship-status").html(data.relationship_status);
	serverData = data;

	addGraph(data);
}
function failedLoadConversation(xhr, textStatus, error) {
	$("#loading").hide();
	$("#error-display").text(textStatus + ": " + error).show();
}
var useLegacyFetch = false;
function loadHandler() {
	if (useLegacyFetch) {
		var conversationData = localStorage.conversationData;
		if (!conversationData) {
			$("#loading").hide();
			$("#error-display").text("Hey, this isn't a Facebook conversation (go to messages full view)!").show();
			return;
		}
		runFetch(conversationData);
	} else {
		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			var tab = tabs[0];
			chrome.tabs.executeScript(tab.id, {file: "content.js"}, function(returnVals) {
				var returnVal = JSON.parse(returnVals[0]);
				if (returnVal.error) {
					$("#loading").hide();
					$("#error-display").text(returnVal.error).show();
					return;
				}
				var conversationData = returnVal.output;
				chrome.cookies.getAll({url: "https://www.facebook.com/ajax/mercury/thread_info.php"}, function(cookies) {
					var cookie = cookies.map(function(a){return a.name + "=" + a.value;}).
						join("; ");
					conversationData["Cookie"] = cookie;
					runFetch(conversationData);
				});
			});
		});
	}
}
function runFetch(conversationDataJson) {
	var conversationData = JSON.stringify(conversationDataJson);
	textbody = document.getElementById("textbody");
	interface_container = document.getElementById("interface-container");

	$(interface_container).find("#sentiment_btn").on("click", function(){addGraph(serverData);});
	$(interface_container).find("#bias_btn").on("click", function(){addBiasGraph(serverData);});

	// var data = hasCachedData('testData');
	// if (data) {
	// 	console.log("Using cached data:" + data);
	// 	loadedConversation(data);
	// }
	// else {
	// 	console.log("Getting new data");
		jQuery.getJSON(API_ENDPOINT, "data=" + encodeURIComponent(conversationData), loadedConversation).fail(
			failedLoadConversation);
	// }

    // time tooltips
    tip = d3.select("body").append("div")
    	.attr("class", "tooltip")
    	.style("visibility","hidden");
}

$(document).ready(loadHandler);
