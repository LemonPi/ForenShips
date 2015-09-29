"use strict";

var textbody;
var interface_container;
var active_chart;

var serverData;

var conversationData = "{}";
// var API_ENDPOINT = "http://forenships.co/diagnose";
var API_ENDPOINT = "http://localhost:8000/diagnose";
function toXYObj(o) {
	return {x: o[0], y: o[1], size: o[2].length, body: o[2]};
}
function addGraph(datain) {
	var chart_sentiments = $($(interface_container).find('#chart')[0]);
	chart_sentiments.removeClass("hidden-chart");
	if (chart_sentiments.attr("data-created")) {
		// already exists, just change visibilities
	}
	else {
		/*
		chart_sentiments = document.createElement("div");
		chart_sentiments.id = "chart";
		var svgElem = document.createElement("svg");
		svgElem.height = 400;
		chart_sentiments.appendChild(svgElem);
		interface_container.appendChild(chart_sentiments, 0);
		chart_sentiments = $(chart_sentiments).addClass("main-chart");*/
		chart_sentiments.attr("data-created", "true");
		nv.addGraph(function() {
			var chart = nv.models.scatterChart();
			chart.showDistX(true);
			chart.xAxis.axisLabel("Time")
				.tickFormat(function(dx) {return d3.time.format("%x")(new Date(dx));});
			chart.yAxis.axisLabel("Sentiment");
			chart.forceY([0,1]);

			chart.tooltip.contentGenerator(function (obj) {
				textbody.innerHTML = obj.point.body.replace(/\n/g, "<br>")
				// color messages based on who's message is on mouseover
				if (obj.seriesIndex === 0) textbody.className = "mymessage";
				else textbody.className = "";

				return obj.point.y;
			});


			var data = [{
				values: datain.data[0].map(toXYObj),
				key: "Sent",
				color: "#ff9900"
				}, {
				values: datain.data[1].map(toXYObj),
				key: "Received",
				color: "#0099ff"
				}];
			//console.log(JSON.stringify(data));
			//console.log(d3.select("#chart svg"));
			d3.select("#chart svg").datum(data).call(chart);
		});
	}
	if (active_chart && active_chart.attr("id") != chart_sentiments.attr("id")) active_chart.addClass("hidden-chart");
	active_chart = chart_sentiments;
}

function toBiasObj(o) {
	return {x: o[0], y: o[1]};
}
function addBiasGraph(datain) {
	var chart_bias = $($(interface_container).find('#chart_bias')[0]);
	chart_bias.removeClass("hidden-chart");
	if (chart_bias.attr("created")) {
		// already exists, just change visibilities
	}
	else {
		/*
		chart_bias = document.createElement("div");
		chart_bias.id = "chart_bias";
		chart_bias.class = "main-chart";
		var svgElem = document.createElement("svg");
		svgElem.height = 400;
		chart_bias.appendChild(svgElem);
		interface_container.appendChild(chart_bias, 0);
		chart_bias = $(chart_bias).addClass("main-chart");
		*/
		chart_bias.attr("data-created", "true");
		nv.addGraph(function() {
			var chart = nv.models.lineChart();
			chart.xAxis.axisLabel("Time")
				.tickFormat(function(dx) {return d3.time.format("%x")(new Date(dx));});
			chart.yAxis.axisLabel("Bias");	

			var data = [{
				values: datain.bias.map(toBiasObj),
				key: "Relationship bias",
				color: "#0099ff"
			}];
			console.log(JSON.stringify(data));
			d3.select("#chart_bias svg").datum(data).call(chart);
		});

		chart_bias.insertAfter(active_chart);
	}

	if (active_chart && active_chart.attr("id") != chart_bias.attr("id")) active_chart.addClass("hidden-chart");
	active_chart = chart_bias;
}

function loadedConversation(data) {
	$("#loading").hide();
	$("#interface-container").show();
	console.log(data);
	$("#health-points").text(data.health_points);
	$("#relationship-status").html(data.relationship_status);
	serverData = data;
	addGraph(data);
}
function failedLoadConversation(xhr, textStatus, error) {
	$("#loading").hide();
	$("#error-display").text(textStatus + ": " + error).show();
}
function loadHandler() {
	conversationData = localStorage.conversationData;
	if (!conversationData) {
		$("#loading").hide();
		$("#error-display").text("Hey, this isn't a Facebook conversation (go to messages full view)!").show();
		return;
	}
	textbody = document.getElementById("textbody");
	interface_container = document.getElementById("interface-container");

	$(interface_container).find("#sentiment_btn").on("click", function(){addGraph(serverData);});
	$(interface_container).find("#bias_btn").on("click", function(){addBiasGraph(serverData);});

	jQuery.getJSON(API_ENDPOINT, "data=" + encodeURIComponent(conversationData), loadedConversation).fail(
		failedLoadConversation);
}
$(document).ready(loadHandler);
