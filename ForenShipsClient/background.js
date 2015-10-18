"use strict";
// fix by making dict of dicts keyed on URL/tab to allow multi-tab/multi-window usage
var active = {};
var monUrl = "https://www.facebook.com/ajax/mercury/thread_info.php*";
var needsFromPostData = ["__user", "__a", "__dyn", "__req", "fb_dtsg", "ttstamp", "__rev"];
chrome.webRequest.onBeforeRequest.addListener(
        handleBeforeRequest, {urls: [monUrl]},
        ["requestBody"]);
chrome.webRequest.onSendHeaders.addListener(
		handleSendHeaders, {urls: [monUrl]},
		["requestHeaders"]);
function setActive(active) {
	localStorage.conversationData = JSON.stringify(active);
}
function parsePostData(postDataRaw) {
	var splited = postDataRaw.split("&");
	var a = {};
	for (var i = 0; i < splited.length; i++) {
		var b  = splited[i].split("=");
		a[b[0]] = b[1];
	}
	return a;
}
function handleBeforeRequest(details) {
	var decoder = new TextDecoder();
	var postDataRaw = decoder.decode(details.requestBody.raw[0].bytes);
	var postData = parsePostData(postDataRaw);
	console.log(postData);
	for (var i = 0; i < needsFromPostData.length; i++) {
		var nam = needsFromPostData[i];
		if (postData[nam]) active[nam] = postData[nam];
	}
	var uids = [postData["__user"]];
	for (var i in postData) {
		if (i.indexOf("messages[user_ids][") == 0) {
			var b = i.substring("messages[user_ids][".length, i.indexOf("]", "messages[user_ids][".length));
			if (uids.indexOf(b) == -1) uids.push(b);
		}
	}
	if (uids.length > 0) active.uids = uids;
	setActive(active);
}
function handleSendHeaders(details) {
	var requestHeadersRaw = details.requestHeaders;
	var cookiesHeaderRaw = null;
	for (var i = 0; i < requestHeadersRaw.length; i++) {
		if (requestHeadersRaw[i].name != "Cookie") continue;
		cookiesHeaderRaw = requestHeadersRaw[i].value;
	}
	active["Cookie"] = cookiesHeaderRaw;
	setActive(active);
}

// page action

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {urlPrefix: "https://www.facebook.com/messages/"},
        }),
      ],
      // ... show the page action.
      actions: [new chrome.declarativeContent.ShowPageAction() ]
    }]);
  });
});
