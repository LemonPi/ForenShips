var dumper = require('../analyser.js');
var model = require('./model');

var http = require('http');
var dispatcher = require('httpdispatcher');
var querystring = require('querystring');

var SAMPLE_POINTS = 30;

function handle_request(req, res) {
	try {
		console.log(req.url);
		// dispatch
		dispatcher.dispatch(req, res);
	}
	catch(err) {
		console.log(err);
		throw err;
	}
}

function got_sentiment(req, res, fail, sentiments, user_initiated) {
	if (fail) {
		console.log(fail);
		res.end(500);
		return;
	}
	// var people = [[], []];
	// var cur = user_initiated? 0: 1;
	// for (var i = 0; i < sentiments.length; i++) {
	// 	var m = sentiments[i];
	// 	if (m[1] == 0) {
	// 		cur = m[0];
	// 	} else {
	// 		people[cur].push([m[0], m[2], m[3]]);
	// 		cur = cur ^ 1;
	// 	}

	// }

	// analyze sentiments to determine your relationship status and the health of the relationship
	// var relationship_properties = [420, "oxidizize it", people];
	var relationship_properties = model.analyze_sentiments(sentiments, user_initiated);


	var relationship_response_json = JSON.stringify({
		health_points: relationship_properties[0],
		relationship_status: relationship_properties[1],
		data: relationship_properties[2],
		bias: relationship_properties[3]

	});

	res.end(relationship_response_json);

}

// dispatching
dispatcher.setStatic('resources');
// GET request for diagnostics of relationship
dispatcher.onGet("/diagnose", function(req, res) {
	res.writeHead(200, {"Content-Type": "application/json"});

	var dataquery = querystring.parse(req.url.substring(req.url.indexOf("?") + 1));
	console.log(dataquery);
	var user_data = JSON.parse(dataquery.data);

	// two lists of (time start, time end, sentiment) tuples where time is sec since epoch and sentiment is float
	// each tuple is a continguous message "exchange" from one side; the two lists' length should differ by at most 1
	dumper.getMergedFBMsg(user_data, 2000, 0, got_sentiment.bind(null, req, res));
	//got_sentiment(req, res, false, [[1,2,0.5],[2,3,0.7],[0,0,null],[4,7,0.1],[8,10,0.3]], true);
	//dumper.testFromFile(got_sentiment.bind(null, req, res));

});


http.createServer(handle_request).listen(process.env.PORT || 8000, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8000/');
