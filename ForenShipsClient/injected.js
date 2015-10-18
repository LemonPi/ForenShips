(function () {
function getInfo() {
	var asyncParams = require("getAsyncParams")("POST");
	var mainDiv = document.querySelector('[aria-label="Message thread contents"]');
	if (!mainDiv) {
		return {error: "No conversation found :("};
	}
	var hovercards = mainDiv.querySelectorAll('[data-hovercard]');
	var msgGroups = [];
	for (var a = 0; a < hovercards.length; a++) {
		var hoverurl = decodeURI(hovercards[a].attributes["data-hovercard"].textContent);
		var query = hoverurl.substring(hoverurl.indexOf("?") + 1).split("&");
		for (var q = 0; q < query.length; q++) {
			if (query[q].startsWith("id=")) {
				var id = query[q].split("=")[1];
				if (id != asyncParams.__user && msgGroups.indexOf(id) < 0) {
					msgGroups.push(id);
				}
			}
		}
	}
	if (msgGroups.length == 0) {
		return {error: "No conversation found :("};
	}
	if (msgGroups.length != 1) {
		return {error: "Group messages not supported"};
	}
	asyncParams.uids = [asyncParams.__user, msgGroups[0]];
	return {output: asyncParams};
}
document.getElementById("forenships-script").textContent = JSON.stringify(getInfo());
})();