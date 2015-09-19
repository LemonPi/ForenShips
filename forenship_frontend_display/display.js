"use strict";
var conversationData = "{}";
var API_ENDPOINT = "http://localhost:8000/sample_data.json";
function loadedConversation(data) {
	$("#loading").hide();
	console.log(data);
	$("#health-points").text(data.health_points);
	$("#relationship-status").text(data.relationship_status);
}
function failedLoadConversation(xhr, textStatus, error) {
	$("#loading").hide();
	$("#error-display").text(textStatus + ": " + error).show();
}
function loadHandler() {
	jQuery.getJSON(API_ENDPOINT, "data=" + encodeURIComponent(conversationData), loadedConversation).fail(
		failedLoadConversation);
}
$(document).ready(loadHandler);
