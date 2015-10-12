Friendship Forensics
========================

Debug your friendships through sentiment analysis of your conversations with a friend. 

Find common trends such as whether you are more eager to start conversations than them and whether you put more time and effort into the conversation than they do.

Pinpoint specific exchanges (datetime and the message contents) where you and your friend's sentiments clashed

Usage
=============

1. Download and install as chrome extension [here](https://chrome.google.com/webstore/detail/forenships/jpbkgmamfnkcmmakaoacpcjboglfmhgn)
2. In Chrome, go to [facebook.com/messages](https://www.facebook.com/messages/) and open any conversation with a friend
3. Scroll up until some messages load
4. Press extension icon to analyze messages with this friend

Known Issues
============

The script sometimes has trouble with very large conversations (>100k messages). Facebook seems to rate limit this, and returns empty responses. In such cases, the script will retry after 30s until it gets a valid response.

If an error occurs, try scrolling up on the message until older messages load and then press the icon again.
