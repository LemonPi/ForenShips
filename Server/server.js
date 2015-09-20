var dumper = require('../analyser.js');

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
	var people = [[], []];
	var cur = user_initiated? 0: 1;
	for (var i = 0; i < sentiments.length; i++) {
		var m = sentiments[i];
		if (m[1] == 0) {
			cur = m[0];
		} else {
			people[cur].push([m[0], m[2]]);
			cur = cur ^ 1;
		}

	}

	// analyze sentiments to determine your relationship status and the health of the relationship
	var relationship_properties = [420, "oxidizize it", people];
		//analyze_sentiments(sentiments, user_initiated);


	var relationship_response_json = JSON.stringify({
		health_points: relationship_properties[0],
		relationship_status: relationship_properties[1],
		data: relationship_properties[2]
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
	// dumper.getMergedFBMsg(user_data, 2000, 0, got_sentiment.bind(null, req, res));
	//got_sentiment(req, res, false, [[1,2,0.5],[2,3,0.7],[0,0,null],[4,7,0.1],[8,10,0.3]], true);
	dumper.testFromFile(got_sentiment.bind(null, req, res));

});

function analyze_sentiments(sentiments, user_initiated) {
	// returns [health_points, relationship_status, condensed sentiments] by analyzing the sentiment between two parties in a conversation
	var YOU = 0;
	var THEM = 1;

	var condensed_sentiments = [[],[]];

	// divide sentiments into at most 30 exchanges to be plotted, but analysis should still be done on each exchange
	var num_exchanges = sentiments.length;
	var exchanges_per_bucket = Math.max(1, num_exchanges / 30);

	// length of time until they responded to your first message
	var loneliness = [0, 0];
	// number of times each person initiated a conversation (more eager than the other)
	var eagerness = [0, 0];
	// positive score means your messages are more positive than theirs
	var bias = 0;

	var bucket_e = [0, 0];	// when over exchanges per bucket, fill bucket
	var bucket_sentiment = [0, 0];
	var bucket_time = [0, 0];

	var sender = (user_initiated)? YOU : THEM;
	++eagerness[sender];

	for (var e = 0; e < num_exchanges; ++e) { // for each exchange (contiguous messages from one sender)
		var exchange = sentiments[e];
		console.log(exchange);
		// conversation went stale and a new conversation was started
		if (exchange[1] == 0) {
			console.log("stale conversation, restarting with " + exchange[0]);
			sender = exchange[0];	// start time either 0 or 1 to indicate who starts the next convo
			++eagerness[sender];
			continue;	// don't process the body of this one
		}

		// scale by the freshness of exchange - the more recent the more weighted
		loneliness[sender] += (exchange[1] - exchange[0]) * e; 

		console.log("loneliness: " + loneliness[sender]);

		if (sender == YOU)
			bias += exchange[2] * e;
		else
			bias -= exchange[2] * e;

		console.log("bias: " + bias);

		++bucket_e[sender];
		// add to bucket for drawing
		bucket_time[sender] += exchange[1] + exchange[0];	// divide by 2 when pushing into bucket
		bucket_sentiment[sender] += exchange[2];
		// filled bucket, start on next one
		if (bucket_e[sender] >= bucket_sentiment[sender]) {
			console.log(sender + " bucket filled");
			condensed_sentiments[sender].push([ bucket_time[sender] / (2*bucket_e[sender]), 
				bucket_sentiment[sender] / bucket_e[sender]]);
			// clear counters for next bucket with e_in_bucket starting at 0
			bucket_sentiment[sender] = bucket_time[sender] = bucket_e[sender] = 0;
		}

		// switch sender
		if (sender == YOU) 
			sender = THEM;
		else 
			sender = YOU;
		console.log("sender now " + sender);
	}
	// any left over bucket still working on
	for (var s = 0; s < 2; ++s) {
		if (bucket_e[s]) {
			console.log("left over bucket");	
			condensed_sentiments[s].push([bucket_time[s] / (2*bucket_e[s]), 
				bucket_sentiment[s] / bucket_e[s]]);
		}
	}

	console.log(condensed_sentiments[YOU]);
	console.log(condensed_sentiments[THEM]);

	return [50, "you are friends", condensed_sentiments];
}

http.createServer(handle_request).listen(process.env.PORT || 8000, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8000/');