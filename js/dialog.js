$('#submit').click(function() {
	console.log($('#PIN').val());
	chrome.runtime.sendMessage({method: "PIN", item: $('#PIN').val()}, function(response) {

        });
});