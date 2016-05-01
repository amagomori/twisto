// HACK: Replace :first and :last to first() and last()
var $timeline = $('#timeline');
var bg = chrome.extension.getBackgroundPage();

const DOWNLOAD_COUNT = 200;

$(function()
{
	// TODO: download tweets and show them if stackpointer's value is 0 or undefined.
	//localStorage.removeItem('timelineCache');

	var timelineChache = Preference.get('timelineCache');

	if (timelineChache === undefined)
	{
		showPreparedTweet();
	}
	else
	{
		resumeChache(timelineChache);

		ScrollPos.set(Preference.get('scrollPosition'));

		refleshTimeStamp();

		if (existPreparedTweet())
		{
			showPreparedTweet();
		}
		else
		{
			// waitMediaLoad().then(ScrollPos.set);
		}
	}

	if (Preference.get('avator') !== undefined)
	{
		$('.avator').css('background-image', 'url(' + "../image/white.png" + ')');
		$('.username').text('Twisto');
		// $('.avator').css('background-image', 'url(' + Preference.get('avator') + ')');
		// $('.username').text(localStorage['screen_name']);
	}

	// TODO: Clear-all method.

	$(window).scroll(function(ev)
	{
		cacheTimeline();

		ScrollPos.save(ScrollPos.top());

		if (ScrollPos.isPageEnd())
		{
			console.log('PageEnd.');

			var max_stack_id	= parseInt($timeline.children().last().find('.stack_id').text()) - 1;
			var since_stack_id	= max_stack_id - 15;

			if (max_stack_id === 1)
			{
				console.log('LastTweet.');
				return;
			}

			if (since_stack_id < 0)
			{
				since_stack_id = 0;
			}

			getTweets(since_stack_id, max_stack_id)
			.then(toDoms)
			.then(function(newestIsFirst)
			{
				oldestIsFirst = newestIsFirst.reverse();

				$.each(oldestIsFirst, function(index, element)
				{
					$(element).one('inview', saveLastInview);

					$timeline.append(element);
				});
			});
		}
	});

	// mark Read.
	$('.check').click(function()
	{
		markRead();
	});

    $('.tweet').on('inview', saveLastInview);
});

function saveLastInview(event, isInView, visiblePartX, visiblePartY)
{
    if (isInView)
    {
    	    		localStorage['lastInview'] = $(this).find('.stack_id').text();
        	console.log('Showed:' + localStorage['lastInview']);
    	// if (visiblePartY == 'top')
    	// {
    	// 	localStorage['lastInview'] = $(this).find('.stack_id').text();
     //    	console.log('Showed:' + localStorage['lastInview']);
    	// }
    }
    else
    {
    }
    console.log('-------');
}

function resumeChache(cache)
{	
	console.log('Resumed chache.');
	$timeline.html(cache);
	// document.getElementById("timeline").innerHTML = cache;
}

function showPreparedTweet()
{
	var max_stack_id	= getStackPointer() - 1;
	var since_stack_id	=
						  ($timeline.children().length === 0)
						? max_stack_id - 25
						: $timeline.children().first().find('.stack_id').text();

	getTweets(since_stack_id, max_stack_id)
	.then(toDoms)
	.then(pileUpAbove)
	.then(waitMediaLoad);
}

function existPreparedTweet()
{
	if ($timeline.children().length === 0)
	{
		return 0 < getStackPointer();
	}
	
	var top_stack_id	= $timeline.children().first().find('.stack_id').text();

	return top_stack_id < getStackPointer() - 1;
}

function toDoms(tweets)
{
	return new Promise(function(resolve, reject)
	{
		var makeDomTasks = makeNewArray(tweets.length, makeTweetDom);

		var tweetDoms = [];

		// TODO: remove Promise.all
		$.each(tweets, function(index, item)
		{
			makeDomTasks[index].call(null, item).then(function($dom)
			{
				tweetDoms.push($dom);

				if (index === tweets.length - 1)
				{
					resolve(tweetDoms);
				}
			});
		});
	});
}

function makeTweetDom(tweet)
{
	return new Promise(function(resolve, reject)
	{
		var $template = $('<div class="tweet">');

		$template.load(chrome.extension.getURL("/html/tweet.html"), function()
		{
			var actualTweet = null;
			var retweetUser = null;

			// Is this tweet contains RT?
			if ('retweeted_status' in tweet)
			{
				actualTweet = tweet.retweeted_status;
				retweetUser = tweet.user.name;
				$('.retweet', $template).text(retweetUser);
			}
			else
			{
				actualTweet = tweet;
				$('.content-retweet', $template).hide();
			}

			// Text
			var linkedText = Autolinker.link(actualTweet.text);
			$template.find('.text').html(linkedText.replace(' rel="noopener noreferrer"', ''));

			// Is this tweet contains media?
			if ('media' in actualTweet.entities)
			{
				var media = actualTweet.entities.media;

				$.each(media, function(index, item)
				{
					var $mediaDom = $('<div><a href="" target="_blank"><img class="media"></img></a></div>');
					
					$('img', $mediaDom).attr('src', item.media_url);
					$('a', $mediaDom).attr('href', item.media_url + ':orig');

					$template.find('.content-body').append($mediaDom);
				});
			}

			// User icon
			var profileImageUrl = actualTweet.user.profile_image_url;
			$template.find('.user_icon').attr('src', profileImageUrl.replace('_normal', ''));
			$template.find('.profile').attr('href', 'https://twitter.com/' + actualTweet.user.screen_name);

			// User name
			$template.find('.name').text(actualTweet.user.name);
			$template.find('.screen_name').text(actualTweet.user.screen_name);

			// Time
			$template.find('.time').text(timeAgo(actualTweet.created_at));
			$template.find('.time').attr('href', 'https://twitter.com/' + actualTweet.user.screen_name + '/status/' + actualTweet.id_str);
			if (isReaded(tweet.stack_id))
			{
				$template.find('.time').removeClass('is_unread');
			}

			// Statuses
			$template.find('.tweet_id').text(actualTweet.id_str);
			$template.find('.stack_id').text(tweet.stack_id);

			$template.find('.timestamp').text
			(
				('retweeted_status' in tweet)
				? tweet.created_at
				: actualTweet.created_at
			);

			resolve($template);
		});
	});
}

function isReaded(stack_id)
{
	if (localStorage['lastReaded'] === undefined)
		return false;

	return stack_id <= localStorage['lastReaded'];
}

function refleshTimeStamp()
{
	var children = $timeline.children();

	$.each(children, function()
	{
		var timeStamp = $(this).find('.timestamp').text();
		$(this).find('.time').text(timeAgo(timeStamp));
	});

	console.log('refleshed TimeStamp.');
}

function timeAgo(b) {
    var c = (Date.now() - new Date(b)) / 1000;
    var a = "s";
    if (c >= 60) {
        c /= 60;
        a = "m";
        if (c >= 60) {
            c /= 60;
            a = "h";
            if (c >= 24) {
                c /= 24;
                a = "d";
                if (c >= 7) {
                    c /= 7;
                    a = "w"
                }
            }
        }
    }
    return Math.floor(c) + a
}

function pileUpAbove(oldestIsTopDoms, $following)
{
	return new Promise(function(resolve, reject)
	{
		// TODO: doms.length === 0

		(
			($following === undefined) 
			? $timeline 
			: $following
		)
		.prepend(oldestIsTopDoms[0]);

		$following = $(oldestIsTopDoms[0]);

		$.each(oldestIsTopDoms, function(index, item)
		{
			if (index === 0)
			{
				return true; // continue.
			}

			$following.before(item);

			$following = item;

			if (index === oldestIsTopDoms.length - 1)
			{
				resolve();
			}
		});
	});
}

function waitMediaLoad()
{
	return new Promise(function(resolve, reject)
	{
		var $medias = $(".media");
		var length  = $medias.length;
		var done = 0;

		if (length === 0)
		{
			resolve();
		}

		$medias.each(function(index, item)
		{
			item.one("load", function()
			{
				done++;

				if (length == done)
				{
					resolve();
				}

			}).each(function()
			{
				if(item.complete) item.load();
			});
		});
	});
}

function markRead()
{
	var $tweets = $timeline.children();

	$.each($tweets, function() {
		$(this).find('.time').removeClass('is_unread');
	});

	cacheTimeline();

	var lastReaded = $timeline.children().first().find('.stack_id').text();
	Preference.set('lastReaded', lastReaded);

	Preference.set('unreadCount', '0');
	chrome.browserAction.setBadgeText({ text: '0' });

	// window.close();
}

function cacheTimeline()
{
	var children = $timeline.children();
	var cache 	 = '';

	var inviewed = localStorage['lastInview'];

	$.each(children, function()
	{
		var $this	 = $(this);
		var stack_id = $this.find('.stack_id').text();

		// TODO: 
		const MARGIN = 10;

		if (stack_id >= inviewed - MARGIN)
		{
			cache += $this[0].outerHTML;
		}
		else
		{
			return false;
		}
	});

	Preference.set('timelineCache', cache);
}

