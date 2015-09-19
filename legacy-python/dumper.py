import urllib2
import urllib
import gzip
import os
import json
import sys
import time
import StringIO

import settings_local

def dumpFBMsg(CONF, limit, offset, __DEBUG):
    __author__ = "Raghav Sood"
    __copyright__ = "Copyright 2014"
    __credits__ = ["Raghav Sood"]
    __license__ = "CC"
    __version__ = "1.0"
    __maintainer__ = "Raghav Sood"
    __email__ = "raghavsood@appaholics.in"
    __status__ = "Production"

    error_timeout = 30 # Change this to alter error timeout (seconds)
    general_timeout = 7 # Change this to alter waiting time afetr every request (seconds)
    raw_messages = []
    output_list = []
    talk = CONF["CONVERSATION_ID"]
    messages_data = "lolno"
    end_mark = "\"end_of_history\""
    headers = {"origin": "https://www.facebook.com", 
    "accept-encoding": "gzip,deflate", 
    "accept-language": "en-US,en;q=0.8", 
    "cookie": CONF["USER_COOKIE"], 
    "pragma": "no-cache", 
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.122 Safari/537.36", 
    "content-type": "application/x-www-form-urlencoded", 
    "accept": "*/*", 
    "cache-control": "no-cache", 
    "referer": "https://www.facebook.com/messages/zuck"}

    base_directory = "Messages/"
    directory = base_directory + str(talk) + "/"
    pretty_directory = base_directory + str(talk) + "/Pretty/"

    try:
            os.makedirs(directory)
    except OSError:
            pass # already exists

    try:
            os.makedirs(pretty_directory)
    except OSError:
            pass # already exists

    while end_mark not in messages_data:

            data_text = {
                "messages[user_ids][" + str(talk) + "][offset]": str(offset), 
                "messages[user_ids][" + str(talk) + "][limit]": str(limit), 
                "client": "web_messenger", 
                "__user": CONF["USER_ID"], 
                "__a": CONF["USER_A"], 
                "__dyn": CONF["USER_DYN"], 
                "__req": CONF["USER_REQ"], 
                "fb_dtsg": CONF["USER_FB_DTSG"], 
                "ttstamp": CONF["USER_TTSTAMP"], 
                "__rev": CONF["USER_REV"]
            }
            data = urllib.urlencode(data_text)
            url = "https://www.facebook.com/ajax/mercury/thread_info.php"
            
            print "Retrieving messages " + str(offset) + "-" + str(limit+offset) + " for conversation ID " + str(talk)
            req = urllib2.Request(url, data, headers)
            response = urllib2.urlopen(req)
            compressed = StringIO.StringIO(response.read())
            decompressedFile = gzip.GzipFile(fileobj=compressed)
            
            
            if __DEBUG:
                outfile = open(directory + str(offset) + "-" + str(limit+offset) + ".json", 'w')

            messages_data = decompressedFile.read()
            messages_data = messages_data[9:]
            json_data = json.loads(messages_data)
            if json_data is not None and json_data['payload'] is not None:
                    try:
                            tmp_msg = json_data['payload']['actions']
                            raw_messages += tmp_msg
                    except KeyError:
                            pass #no more messages
            else:
                    print "Error in retrieval. Retrying after " + str(error_timeout) + "s"
                    print "Data Dump:"
                    print json_data
                    time.sleep(error_timeout)
                    continue

            if __DEBUG:
                outfile.write(messages_data)
                outfile.close()	
                command = "python -mjson.tool " + directory + str(offset) + "-" + str(limit+offset) + ".json > " + pretty_directory + str(offset) + "-" + str(limit+offset) + ".pretty.json"
                os.system(command)
                offset = offset + limit
                time.sleep(general_timeout) 

    if raw_messages is not None:

        if __DEBUG: msgfile = open("msg.txt", "wb")

        for msg_blk in raw_messages:
            fbid = str(msg_blk['author']).split(':')[1]
            body = str(msg_blk['body'])
            if __DEBUG: 
                msgfile.writelines("%s = %s\n" % (fbid, body))

            output_list += [ [fbid, body] ]
           
        if __DEBUG: msgfile.close()

    if __DEBUG:
        finalfile = open(directory + "complete.json", 'wb')
        finalfile.write(json.dumps(raw_messages))
        finalfile.close()
        command = "python -mjson.tool " + directory + "complete.json > " + pretty_directory + "complete.pretty.json"
        os.system(command)

    if __DEBUG:
        print output_list
    return output_list


if __name__=="__main__":
    if len(sys.argv) <= 1:
        print "Usage:\n 	python dumper.py [chunk_size (recommended: 2000)] [{optional} offset location (default: 0)]"
        print "Example conversation with Raghav Sood"
        print "	python dumper.py 1075686392 2000 0"
        sys.exit()

    offset = int(sys.argv[2]) if len(sys.argv) >= 3 else int("0")
    limit = int(sys.argv[1])

    CONF = settings_local.__CONFIG_PARAM
    __DEBUG = 1

    dumpFBMsg(CONF, limit, offset, __DEBUG)
