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
	var UNEQUAL_EAGERNESS = 1 << 1;
	var LARGE_DISCREPENCY = 1 << 2;
	var TOO_MUCH_BIAS = 1 << 3;
	var INFREQUENT_MESSAGES = 1 << 4;
	var FOREVER_ALONE = 1 << 5;
	var TALKS_TO_SELF = 1 << 6;
	var warnings = FINE;

	// each metric contributes up to 25 health points, for total of 100
	var health_points = 0;
	var ppm = 25;	// points per metric
	var warning_penalty = 10;


	var ratio_threshold = 1.5;
	var ratio_threshold_inverse = 1/ratio_threshold;
	var frequency_threshold = 1000 * 60 * 60 * 24 * 7;	// 1 week on average
	var discrepency_threshold = 0.4;

	// if ratios > 1.5 or or lower than 0.66 then warnings

	// ratio where 1 is you guys respond in the same amount of time
	var your_responsiveness = average_over_array(responsiveness[YOU]);
	var their_responsiveness = average_over_array(responsiveness[THEM]);
	var relative_responsiveness = your_responsiveness / their_responsiveness;

	console.log("Responsiveness");
	console.log(relative_responsiveness);
	if (relative_responsiveness > ratio_threshold || relative_responsiveness < ratio_threshold_inverse)
		warnings |= UNEQUAL_RESPONSIVENESS;
	if (your_responsiveness > frequency_threshold || their_responsiveness > frequency_threshold) {
		warnings |= INFREQUENT_MESSAGES;
		health_points -= warning_penalty;
	}

	if (relative_responsiveness > 1)
		health_points += ppm / relative_responsiveness;	// the greater the deviation from 1, the smaller the score
	else
		health_points += ppm * relative_responsiveness;


	// ratio where 1 is you guys iniate the same number of conversations
	console.log("Eagerness");
	console.log(eagerness[YOU]);
	console.log(eagerness[THEM]);
	var relative_eagerness = eagerness[YOU] / eagerness[THEM];
	if (relative_eagerness > ratio_threshold || relative_eagerness < ratio_threshold_inverse)
		warnings |= UNEQUAL_EAGERNESS;

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
	function ratioflag(v, thres, flag) {
		if (v > thres) {
			warnings |= flag;
		} else if (v < (1/thres)) {
			warnings |= (flag << 1);
		}
	}
	if (relative_loneliness > ratio_threshold || relative_loneliness < ratio_threshold_inverse)
		warnings |= FOREVER_ALONE;
	if (loneliness[YOU] > frequency_threshold || loneliness[YOU] > frequency_threshold) {
		warnings |= TALKS_TO_SELF;
		health_points -= warning_penalty;
	}
	
	var warning_messages = [
		""
	];
	var your_warnings = [];

	var YOURE_UNRESPONSIVE = 1 << 0;
	var THEYRE_UNRESPONSIVE = 1 << 1;
	var YOURE_NOT_EAGER = 1 << 2;
	var THEYRE_NOT_EAGER = 1 << 3;
	var LARGE_DISCREPENCY = 1 << 2;

	var TOO_MUCH_BIAS = 1 << 3;
	var INFREQUENT_MESSAGES = 1 << 4;
	var FOREVER_ALONE = 1 << 5;
	var TALKS_TO_SELF = 1 << 6;
	for (var i = 0; i < 7; i++) {
		if (warnings & (1 << i)) warning += warning_messages[i];
	}

	// while there's still a warning
	for (var warning = 0; warnings != 0; ++warning) {
		// flavor text
		break;
	}

	return [health_points, "you are friends", condensed_sentiments, bias_history];
}

exports.analyze_sentiments = analyze_sentiments; 
