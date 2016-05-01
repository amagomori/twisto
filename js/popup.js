$(function(){
	console.log('open popup.html');
    // Get all tweets from database
    var storedCount = localStorage['storedCount'];
        for (var i = 0; i < storedCount; i++) {
            var key = 'tw' + i;
            // Get a tweet
            chrome.storage.sync.get(key, function(tweet) {
                console.log(tweet[key]);
                // Show a tweet
                $('#tweets').append( "<p>"+tweet[key].user.name+":"+tweet[key].text+"</p>" );
            });
        }
});



    
// var background = chrome.extension.getBackgroundPage();
// var tweetDB = background.getTweetDB();
// if (tweetDB == null) {
// 	console.log("null");
// 	return;
// }
// for (var i = 0; i < tweetDB.length; i++) {
// 	console.log(tweetDB[i]);
// 	$('#tweets').append( "<p>"+tweetDB[i].user.name+":"+tweetDB[i].text+"</p>" );
// }
