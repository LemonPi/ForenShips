"use strict";
var conversationData = "{}";
var API_ENDPOINT = "http://localhost:8000/sample_data.json";
function toXYObj(o) {
	return {x: o[0], y: o[1]};
}
function addGraph(datain) {
	nv.addGraph(function() {
		var chart = nv.models.lineChart();
		chart.xAxis.axisLabel("Time")
			.tickFormat(function(dx) {return d3.time.format("%x")(new Date(dx));});
		chart.yAxis.axisLabel("Axis 1");
		var data = [{
			values: datain.data[0].map(toXYObj),
			key: "Received",
			color: "#ff9900"
			}, {
			values: datain.data[1].map(toXYObj),
			key: "Sent",
			color: "#0099ff"
			}];
		console.log(JSON.stringify(data));
		console.log(d3.select("#chart svg"));
		d3.select("#chart svg").datum(data).call(chart);
	});
}

function loadedConversation(data) {
	$("#loading").hide();
	$("#interface-container").show();
	console.log(data);
	$("#health-points").text(data.health_points);
	$("#relationship-status").text(data.relationship_status);
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
	jQuery.getJSON(API_ENDPOINT, "data=" + encodeURIComponent(conversationData), loadedConversation).fail(
		failedLoadConversation);
}
$(document).ready(loadHandler);
