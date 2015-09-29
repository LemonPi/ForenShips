// model of relationship health, including key metrics and their calculations

function average_over_array(array) {
	if (array.length == 0) return 0;
	return array.reduce(function(p, e){return p + e;}) / array.length;
}

function analyze_sentiments(sentiments, user_initiated) {
	// returns [health_points, relationship_status, condensed sentiments] by analyzing the sentiment between two parties in a conversation
	var YOU = 0;
	var THEM = 1;

	var condensed_sentiments = [[],[]];
	var bias_history = [];
	console.log("sentiment length: " + sentiments.length);
	// divide sentiments into at most 30 exchanges to be plotted, but analysis should still be done on each exchange
	var num_exchanges = sentiments.length;
	var exchanges_per_bucket = Math.max(1, num_exchanges / (2 * 120));
	console.log(exchanges_per_bucket);

	// length of time until they responded to your first message
	var loneliness = [0, 0];
	// number of times each person initiated a conversation (more eager than the other)
	var eagerness = [0, 0];
	// length of time between end of one person's message and your response
	var responsiveness = [[], []];
	// positive score means your messages are more positive than theirs
	var bias = 0;
	// magnitude of difference over time
	var discrepency = 0;

	var bucket_e = [0, 0];	// when over exchanges per bucket, fill bucket
	var bucket_sentiment = [0, 0];
	var bucket_time = [0, 0];
	var bucket_body = [[], []];

	var sender = (user_initiated)? YOU : THEM;
	++eagerness[sender];

	for (var e = 0; e < num_exchanges; ++e) { // for each exchange (contiguous messages from one sender)
		var exchange = sentiments[e];

		// conversation went stale and a new conversation was started
		if (exchange[1] == 0) {
			console.log("stale conversation, restarting with " + exchange[0]);
			sender = exchange[0];	// start time either 0 or 1 to indicate who starts the next convo
			++eagerness[sender];
			continue;	// don't process the body of this one
		}

		// scale by the freshness of exchange - the more recent the more weighted
		loneliness[sender] += (exchange[1] - exchange[0]); 

		console.log("loneliness: " + loneliness[sender]);

		if (sender == YOU)
			bias += exchange[2];
		else
			bias -= exchange[2];
		// absolute difference in message-response sentiments
		if (e > 1 && sentiments[e-1][1] != 0)
			discrepency += Math.abs(exchange[2] - sentiments[e - 1][2]);

		// the time between your response and your partner's last message
		if (e > 1 && sentiments[e-1][1] != 0)
			responsiveness[sender].push(exchange[0] - sentiments[e - 1][1]);

		bias_history.push([exchange[0], bias]);

		++bucket_e[sender];
		// add to bucket for drawing
		bucket_time[sender] += exchange[1] + exchange[0];	// divide by 2 when pushing into bucket
		bucket_sentiment[sender] += exchange[2];

		bucket_body[sender].push(exchange[3]);
		// filled bucket, start on next one
		if (bucket_e[sender] >= exchanges_per_bucket) {
			console.log(sender + " bucket filled");
			condensed_sentiments[sender].push(
				[ bucket_time[sender] / (2*bucket_e[sender]), 
				bucket_sentiment[sender] / bucket_e[sender], 
				bucket_body[sender].join("\n\n")]);
			// clear counters for next bucket with e_in_bucket starting at 0
			bucket_sentiment[sender] = bucket_time[sender] = bucket_e[sender] = 0;
			bucket_body[sender] = [];
		}

		// condensed_sentiments[sender].push([exchange[0], exchange[2], exchange[3]]);

		// switch sender
		sender ^= 1;

		console.log("sender now " + sender);
	}
	// // any left over bucket still working on
	// for (var s = 0; s < 2; ++s) {
	// 	if (bucket_e[s]) {
	// 		console.log("left over bucket");	
	// 		condensed_sentiments[s].push([bucket_time[s] / (2*bucket_e[s]), 
	// 			bucket_sentiment[s] / bucket_e[s]]);
	// 	}
	// }


	// process different metrics into a predicted status and an overall relationship healthiness

	var FINE = 0;
	var UNEQUAL_RESPONSIVENESS = 1 << 0;
	var UNEQUAL_EAGERNESS = 1 << 2;
	var LARGE_DISCREPENCY = 1 << 4;
	var TOO_MUCH_BIAS = 1 << 6;
	var INFREQUENT_MESSAGES = 1 << 8;
	var FOREVER_ALONE = 1 << 10;
	var TALKS_TO_SELF = 1 << 12;
	var warnings = FINE;
	var warning_messages = [
		"You take a long time to respond to your friend's messages",
		"Your friend takes a long time to respond to your messages",
		"You start a lot more conversations than your friend",
		"Your friend starts a lot more conversations than you",
		// large discrepency is mutual, so there is only 1 value
		"Your sentiments are often at odds",
		"",
		// too much bias
		"You don't message your friend often even",
		"Your friend doens't talk to you much",
		// forever alone
		"You're forever alone...",
		"You often leave your friend hanging",
		// talks to yourself
		"Your friend often leaves you talking to yourself",
		"Your friend often rambles on by themselves"
	];
	// each metric up to ppm points
	var health_points = 0;
	var ppm = 35;	// points per metric
	var warning_penalty = 5;

	function ratioflag(v, thres, flag) {
		if (v > thres) {
			warnings |= flag;
		} else if (v < (1/thres)) {
			warnings |= (flag << 1);
		}
	};
	function valueflag(v2, thres, flag, penalty) {
		if (v2[0] > thres) {
			warnings |= flag;
			health_points -= penalty;
		}
		if (v2[1] > thres) {
			warnings |= (flag << 1);
			health_points -= penalty;
		}
	};


	var ratio_threshold = 2;
	var frequency_threshold = 1000 * 60 * 60 * 24 * 7;	// 1 week on average
	var discrepency_threshold = 0.4;

	// if ratios > 1.5 or or lower than 0.66 then warnings

	// ratio where 1 is you guys respond in the same amount of time
	var your_responsiveness = average_over_array(responsiveness[YOU]);
	var their_responsiveness = average_over_array(responsiveness[THEM]);
	var relative_responsiveness = your_responsiveness / their_responsiveness;

	console.log("Responsiveness");
	console.log(relative_responsiveness);
	ratioflag(relative_responsiveness, ratio_threshold, UNEQUAL_RESPONSIVENESS);
	valueflag([your_responsiveness, their_responsiveness], frequency_threshold, INFREQUENT_MESSAGES, warning_penalty);


	if (relative_responsiveness > 1)
		health_points += ppm / relative_responsiveness;	// the greater the deviation from 1, the smaller the score
	else
		health_points += ppm * relative_responsiveness;


	// ratio where 1 is you guys iniate the same number of conversations
	console.log("Eagerness");
	console.log(eagerness[YOU]);
	console.log(eagerness[THEM]);
	var relative_eagerness = eagerness[YOU] / eagerness[THEM];
	ratioflag(relative_eagerness, ratio_threshold, UNEQUAL_EAGERNESS);

	if (relative_eagerness > 1)
		health_points += ppm / relative_eagerness;
	else
		health_points -= ppm * relative_eagerness;


	// average discrepency between 0-1, 0 means you both express similar sentiments
	var avg_discrepency = discrepency / num_exchanges;	
	console.log("Discrepency");
	console.log(avg_discrepency);

	if (avg_discrepency > discrepency_threshold)
		warnings |= LARGE_DISCREPENCY;

	// 0 discprency is matched and should get full score
	health_points += ppm * (1 - avg_discrepency);


	console.log("Loneliness");
	console.log(loneliness[YOU]);
	console.log(loneliness[THEM]);
	var relative_loneliness = loneliness[YOU] / loneliness[THEM];

	ratioflag(relative_loneliness, ratio_threshold, FOREVER_ALONE);
	valueflag(loneliness, frequency_threshold, TALKS_TO_SELF, warning_penalty);

	

	var your_warnings = [];

	for (var i = 0; warnings != 0; i++) {
		if ((warnings & 1) == 1) your_warnings.push(warning_messages[i]);
		warnings >>= 1;
	}

	// while there's still a warning
	for (var warning = 0; warnings != 0; ++warning) {
		// flavor text
		break;
	}

	if (your_warnings.length === 0)
		your_warnings = "You're just friends";
	else
		your_warnings = your_warnings.join("<br>");

	return [Math.floor(health_points * 100) / 100, your_warnings, condensed_sentiments, bias_history];
}

exports.analyze_sentiments = analyze_sentiments; 
