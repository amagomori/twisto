var requestParams;
var accessParams;
var screenName;
var oauth;
var storedCount;

const APIROOT = 'https://api.twitter.com/1.1/';
const RELOAD_TIME = 5;

const OPTIONS = {
	consumerKey: 'bhSUNhCKA9rEZqg93ozAdRIFk',
	consumerSecret: 'oIXDYMahASHCVAicIwz8ohK4IDMM9cLmWVhsvir3MFwSjM6pmg'
};

// const BADGE_COLOR = "#6B238E";
const BADGE_COLOR = "#32CB99";


chrome.alarms.onAlarm.addListener(function(alarm)
{
	if (alarm.name == 'downloadTweets')
	{	
		test();
	}
});

chrome.browserAction.onClicked.addListener(function(tab)
{
	chrome.tabs.create({url: '../html/timeline.html'});
});

$(function()
{
	// resetDatabase();
	// localStorage.removeItem('timelineCache');

	chrome.browserAction.setBadgeBackgroundColor(
		{ color: BADGE_COLOR}
	);

	oauth = OAuth(OPTIONS);

	if (Preference.get('accessToken') === undefined)
	{
		openAuthPage();
	}
	else
	{
		var accessToken			= Preference.get('accessToken');
		var accessTokenSecret	= Preference.get('accessTokenSecret');

		oauth.setAccessToken(accessToken, accessTokenSecret);

		test();

		saveUserProfiles();

		chrome.alarms.create(
			'downloadTweets',
			{ periodInMinutes : RELOAD_TIME }
		);
	}
});

function test()
{
	var stackPointer = getStackPointer();

	if (stackPointer === 0)
	{
		downloadTweets(0, undefined, 200)
		.then(registTweets);
	}
	else
	{
		getTweet(stackPointer - 1)
		.then(function(tweet)
		{
			downloadTweets(tweet.id_str, undefined, 200)
			.then(registTweets);
		});
	}
}

// function fuck

function openAuthPage()
{
	oauth.get('https://twitter.com/oauth/request_token', function(data)
	{
		requestParams = data.text;

		chrome.tabs.create(
		{
			url: 'https://twitter.com/oauth/authorize?' + requestParams,
		});

		chrome.tabs.create(
		{
			url: chrome.extension.getURL('/html/input_pincode.html'),
			active: true
		});
	},
	function(data)
	{
		throw new Error('Failed OAuth authorization.');
	});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	if (request.method === 'submitPinCode')
	{
		var pinCode = request.item;
		var apiUrl	= 'https://twitter.com/oauth/access_token?oauth_verifier=';

		oauth.get(apiUrl + pinCode + '&' + requestParams, function(data)
		{					
				var accessParams = {};
				var qvars_tmp = data.text.split('&');

				for (var i = 0; i < qvars_tmp.length; i++)
				{
					var y = qvars_tmp[i].split('=');
					accessParams[y[0]] = decodeURIComponent(y[1]);
				}

				oauth.setAccessToken([
					accessParams.oauth_token,
					accessParams.oauth_token_secret
				]);

				Preference.set('accessToken', accessParams.oauth_token);
				Preference.set('accessTokenSecret', accessParams.oauth_token_secret);

				downloadTweets(undefined, undefined, 20)
				.then(registTweets);

				saveUserProfiles();

			},
			function(data)
			{
				throw new Error(data);
			}
		);
	}
});

function saveUserProfiles()
{
	oauth.get(APIROOT + 'account/verify_credentials.json', function(data)
	{
		var profile = JSON.parse(data.text);

		localStorage['screen_name'] = profile.screen_name;
		localStorage['avator'] 		= profile.profile_image_url.replace('_normal', '');
	});
}


function downloadTweets(since_id, max_id, count)
{
	return new Promise(function(resolve, reject)
	{
		var endPoint = APIROOT + 'statuses/home_timeline.json?';

		endPoint += (since_id) ? 'since_id=' + since_id + '&' : '';
		endPoint += (max_id) ? 'max_id=' + max_id + '&' : '';
		endPoint += (count) ? 'count=' + count + '&'  : '';

		endPoint.replace(/([\&\?])$/g, '');

		oauth.get(endPoint, function(data)
		{
			var tweets = JSON.parse(data.text);

			resolve(tweets);
		},
		function(data)
		{
			reject(data);
		});
	});
}
