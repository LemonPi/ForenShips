var Xray = require('x-ray');
var x = Xray();

//var settings = require('./settings_local');

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
    //console.log(headers_text);
    console.log(data_text);

    url = "https://www.facebook.com/ajax/mercury/thread_info.php"
    var qtime = process.hrtime();
    x(url, data_text)(function(err, outdata, res) {
            console.log(outdata);
            var diff = process.hrtime(qtime);
            console.log("Request: %d", (diff[0]*1e9 + diff[1])/1e9);

            //console.log(err);
            // <67 - 740 ms>
            if (!err) {

                //console.log(outdata.toString());
                // Substring out the for loop at the beginning of the return msg
                str_data = outdata.toString().substring(9);

                // Convert to JSON <87 ms>
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
    })
    var diff = process.hrtime(qtime);
    console.log("Request2: %d", (diff[0]*1e9 + diff[1])/1e9);
    
    if (raw_messages) {
        return raw_messages;
    }
    else {
        return null;
    }
}

//dumpFBMsg(settings.__CONFIG_PARAM, 2000, 0);
exports.dumpFBMsg = dumpFBMsg;
