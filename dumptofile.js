var dumper = require("./dumper");
var settingsLocal = require("./settings_local.js");
// use dumper to dump out conv as json to stdout
// useful for local testing w/out worrying about timeouts

// callback: (error, data, userInitiated)
function main() {
    dumper.dumpFBMsg(settingsLocal.__CONFIG_PARAM, 2000, 0, function(fail, data) {
        if (fail) {
            throw fail;
            return;
        }
        console.log("CUT HERE");
        console.log(JSON.stringify(data));
    })
}

main();
