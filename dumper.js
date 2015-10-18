var urllib = require('urllib');

//var settings = require('./settings_local');

// TODO Currently limited to 2000 messages

function dumpFBMsg(CONF, limit, offset, callback) {
    var error_timeout = 30; // Change this to alter error timeout (seconds)
    var general_timeout = 7; // Change this to alter waiting time afetr every request (seconds)

    var raw_messages = {};
    var output_list = {};

    var talk = CONF["conversation_id"];

    var messages_data = "lolno"
    var end_mark = "\"end_of_history\"";
    var headers_text = {
        "origin": "https://www.facebook.com", 
        "accept-encoding": "gzip,deflate", 
        "accept-language": "en-US,en;q=0.8", 
        "cookie": CONF["cookie"], 
        "pragma": "no-cache", 
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.122 Safari/537.36", 
        "content-type": "application/x-www-form-urlencoded", 
        "accept": "*/*", 
        "cache-control": "no-cache", 
        "referer": "https://www.facebook.com/messages/zuck"
    };

    var key1 = "messages[user_ids][" + talk.toString() + "][offset]";
    var key2 = "messages[user_ids][" + talk.toString() + "][limit]";
    var data_text = {
        "client"  : "web_messenger",
        "__user"  : CONF["__user"],
        "__a"     : CONF["__a"],
        "__dyn"   : CONF["__dyn"],
        "__req"   : CONF["__req"],
        "fb_dtsg" : CONF["fb_dtsg"],
        "ttstamp" : CONF["ttstamp"],
        "__rev"   : CONF["__rev"]
    };
    data_text[key1] = offset;
    data_text[key2] = limit;
    // console.log(headers_text);
    // console.log(data_text);

    url = "https://www.facebook.com/ajax/mercury/thread_info.php"
    urllib.request(url, 
        {
            method: 'GET',
            headers: headers_text,
            data: data_text
        }, 
        function(err, outdata, res) {
            // Substring out the for loop at the beginning of the return msg
            console.log(err);
            if (!err) {
                //console.log(outdata.toString());
                str_data = outdata.toString().substring(9);

                // Convert to JSON
                objdata = JSON.parse(str_data);
                // Extract an array of dictionaries w/ parameters
                raw_messages = objdata["payload"]["actions"];
                //for (var i = 0; i < raw_messages.length; ++i) {
                //    console.log(raw_messages[i]["body"]);
                //}
                callback(null, raw_messages);
            } else {
                callback(err, []);
            }
    });
    
    if (raw_messages) {
        return raw_messages;
    }
    else {
        return null;
    }
}

//dumpFBMsg(settings.__CONFIG_PARAM, 2000, 0);
exports.dumpFBMsg = dumpFBMsg;
