var dumper = require("./dumper");
var fs = require("fs");
var indico = require("indico.io");
var HOURS_TO_MILLIS = 1000 * 60 * 60;

indico.apiKey = process.env.INDICO_KEY;

function mergeFBMsg(userData, data) {
    var out = [];
    var lastSender = null;
    var userInitiated = data.length == 0? false: data[0].author == "fbid:" + userData.uids[0];
    var cur = null;
    for (var i = 0; i < data.length; i++) {
        var m = data[i];
        var newStart = i != 0 && (m.timestamp - data[i-1].timestamp) > 5*HOURS_TO_MILLIS;
        if (m.author != lastSender || newStart) {
            // new run
            if (cur) {
                cur.end = data[i-1].timestamp;
                if (cur.body != '') out.push(cur);
            }
            if (newStart) {
                out.push({"start": m.author == "fbid:" + userData.uids[0]? 0: 1, "end": 0, "body": m.author})
            }
            cur = {"start": m.timestamp, "body": m.body};
            lastSender = m.author;
        } else {
            cur.body += " " + m.body;
        }
    }
    if (cur) {
        cur.end = data[i-1].timestamp;
        out.push(cur);
    }
    return {
        "data": out, "userInitiated": userInitiated
    };
}

function sentimentFBMsg(userData, options, callback) {
    var outdata = new Array(options.data.length);
    sentimentFBMsgBatch(options, callback, outdata);
}

function sentimentFBMsgOne(userdata, options, callback, outdata, index) {
    if (index == options.data.length) {
        callback(null, outdata, options.userInitiated);
        return;
    }
    indico.sentiment(options.data[index].body)
        .then(function(res) {
            outdata[index] = [
                options.data[index].start,
                options.data[index].end,
                1 - res[i]
            ]
        }).catch(function(res) {
            console.log(res);
            callback(res, [], false);
        });
    sentimentFBMsgOne(userdata, options, callback, outdata, index + 1);
}

function sentimentFBMsgBatch(options, callback, outdata) {
    // Batch file processing
    indico.sentimentHQ(options.data.map(function(a) {return a.body}))
        .then(function(res) {
            for (var i = 0; i < options.data.length; ++i) {
                outdata[i] = [
                    options.data[i].start,
                    options.data[i].end,
                    1 - res[i]
                ]
            }
            callback(null, outdata, options.userInitiated);
        }).catch(function(res){
            console.log(res);
            callback(res, [], false);
    });
}


// callback: (error, data, userInitiated)
function getMergedFBMsg(userData, limit, offset, callback) {
    getMergedFBMsgImpl_(userData, limit, offset, callback, 2);
}
function getMergedFBMsgImpl_(userData, limit, offset, callback, tries) {
    dumper.dumpFBMsg(userdata, limit, offset, function(fail, data) {
        if (fail) {
            if (tries == 0) {
                callback(fail, [], false);
            } else {
                console.log(fail);
                getMergedFBMsgImpl_(userData, limit, offset, callback, tries - 1);
            }
            return;
        }
        var merged = mergeFBMsg(userData, data);
        sentimentFBMsg(userData, merged, callback);
    })
}

exports.getMergedFBMsg = mergeFBMsg;

function testFromFile(customCallback) {
    var buf = fs.readFileSync("out.json", {encoding: "UTF-8"});
    var data = JSON.parse(buf);
    var userData = {uids: ["0"]};
    var merged = mergeFBMsg(userData, data);
    //console.log(merged);
    //return;
    sentimentFBMsg(userData, merged, customCallback? customCallback: function(error, data, userInitiated) {
        console.log(error);
        console.log(data);
        console.log(userInitiated);
    });
}
exports.testFromFile = testFromFile;

//testFromFile();