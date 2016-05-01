function registTweet(tweet, index)
{
	console.log('[registTweet]' + tweet);
	return new Promise(function(resolve, reject)
	{
		if (!tweet)
		{
			reject(new Error("Can't regist null as one tweet."));
		}

		var object = {};
		var key    = '';

		if (index)
		{
			key = index;
		}
		else
		{
			key = getStackPointer();
		}

		incrementStackPointer();

		object[key] = tweet;

		console.info('Registed the tweet: ' + tweet.text);

		chrome.storage.local.set(object, function(item)
		{
			// console.info('Registed the tweet: ' + item);
			resolve();
		});
	});
}

function registTweets(tweets)
{
	return new Promise(function(resolve, reject)
	{
		if (tweets.length === 0)
		{
			reject(new Error('Tweets for regist is empty'));
		}

		var registFuncs = makeNewArray(tweets.length, registTweet);

		oldFirstTweets = tweets.reverse();

		$.each(registFuncs, function(index, item)
		{
			registFuncs[index].call(null, oldFirstTweets[index]);
		});

		Promise.all(registFuncs).then(function()
		{
			resolve();
		});
	});
}

function getTweet(index)
{
	return new Promise(function(resolve, reject)
	{
		if (index < 0)
		{
			reject(new Error('index < 0'));
		}

		var key =
		(
			(index) ?
			index : getStackPointer() - 1
		);

		// get(optional string or array or object keys, function callback)
		chrome.storage.local.get(String(key), function(item)
		{
			if (!item)
			{
				reject('Failed get tweet (key = ' + key + ')');
			}

			// [key] is necessary.
			// sync.get -> {key: value}
			// returnItems[key] -> value
			var tweet = item[key];

			// Add StackId.
			tweet.stack_id = key;
			console.log(tweet.stack_id);

			resolve(tweet);
		});
	});
}

// TODO:
function getTweets(begin, end)
{
	return new Promise(function(resolve, reject)
	{	
		if (begin < 0 || end < 0)
		{
			reject();
			return;
		}

		// Not include since_id tweet.
		begin++;

		var length = Math.abs(end - begin) + 1;

		var getFuncs = makeNewArray(length, getTweet);

		var tweets = [];

		// HACK: for-Each to Promise.all
		$.each(getFuncs, function(count, item)
		{
			var index = begin + count;

			getFuncs[count].call(null, index).then(function(tweet)
			{
				tweets.push(tweet);

				if (index == end)
				{
					resolve(tweets);
				}
			});
		});
	});
}

function clone(begin, end, gain)
{
	return new Promise(function(resolve, reject)
	{
		for (var i = begin; i <= end; i++)
		{
			getTweet.then(function(tweet, id)
			{
				var newKey = (parseInt(key, 10) + gain).toString();
				var object = {};

				object[newkey] = tweet;

				console.info('Cloned tweet (from = ' + id + ', to = ' + newKey + ')');

				chrome.storage.local.set(object, function()
				{
					// TODO: resolve conditions
				});
			});
		}
	});
}

function incrementStackPointer()
{
	var stackPointer = localStorage['stackPointer'];

	if (isNaN(stackPointer))
	{
		stackPointer = 0;
	}

	console.log('Incremented: ' + stackPointer);

	stackPointer++;

	localStorage['stackPointer'] = stackPointer;
}

function getStackPointer()
{
	var stackPointer = localStorage.getItem('stackPointer');

	if (isNaN(stackPointer) || stackPointer === null || stackPointer === undefined)
	{
		return 0;
	}
	else
	{
		return stackPointer;
	}
}

function resetDatabase()
{
	chrome.storage.local.clear();
	localStorage.removeItem('stackPointer');
	// localStorage['stackPointer'] = 0;
	localStorage.removeItem('lastReaded');
}

function makeNewArray(length, fill)
{
	var array = [];

	var i = 0;
	while (i < length)
	{
		array.push(fill);
		i++;
	}

	return array;
}