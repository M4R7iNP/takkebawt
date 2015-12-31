var https	= require('https'),
	url		= require('url'),
	CONFIG	= require('./config.json'),
	DAY		= 24*60*60*1000;

console.log('Takkebawt started', new Date());

/**
 * Poller function
 */
function fetchPosts() {
	console.log('Takkebawt fetching', new Date());

	var path = new url.Url();
	path.pathname = '/me/feed';
	path.query = {
		fields: 'from{first_name},to,message,comments{from},type',
		access_token: CONFIG.ACCESS_TOKEN,
		since: (new Date(Math.floor(Date.now() / DAY) * DAY)).toJSON()
	};

	var req = https.request({
		method: 'GET',
		hostname: 'graph.facebook.com',
		path: path.format()
	}, function(res){
		res.setEncoding('utf8');

		var responseBody = '';
		res.on('data', function(data){
			responseBody += data;
		});
		res.on('end', function(){
			var jsonResponse = JSON.parse(responseBody);
			if(!jsonResponse.data)
				return console.error('Fatal error! Response did not contain field "data". Parsed response: ', jsonResponse);

			processCongratulations(jsonResponse.data);
		});
	});

	req.end();

	req.on('error', function(e){
		console.error(e);
	});
}

/**
 * Will find unthanked gratulations from given array of gratulations.
 */
function processCongratulations(data) {
	for(var i = 0; i < data.length; i++) {
		var post = data[i];

		if(['status', 'photo'].indexOf(post.type) === -1 ||
		   (post.from && post.from.id == CONFIG.USER_ID) ||
		   (post.to && post.to.data[0].id != CONFIG.USER_ID) ||
		   (post.comments && userHasAlreadyCommented(post.comments.data)))
			continue;

		publishComment(post);
	}
}

/**
 * Returns true if gratulation is thanked for. False otherwise.
 */
function userHasAlreadyCommented(comments) {
	for(var i = 0; i < comments.length; i++)
		if(comments[i].from.id == CONFIG.USER_ID)
			return true;

	return false;
}

/**
 * Pulishes thanking comment on given post.
 */
function publishComment(post) {
	var message = 'Tusen takk, ' + post.from.first_name + '! Godt nyttår! :)';
	console.log('Commented on ' + post.from.first_name + '\'s post');
	var req = https.request({
		method: 'POST',
		hostname: 'graph.facebook.com',
		path: '/' + post.id + '/comments?access_token=' + CONFIG.ACCESS_TOKEN
	}, function(res){
		res.setEncoding('utf8');

		var responseBody = '';
		res.on('data', function(data){
			responseBody += data;
		});
		res.on('end', function(){
			var jsonResponse = JSON.parse(responseBody);
			if(!jsonResponse.id)
				console.error('Fatal error! Publish comment failed', jsonResponse);
		});
	});

	req.write('message=' + encodeURIComponent(message));
	req.end();

	req.on('error', function(e){
		console.error(e);
	});
}

setInterval(fetchPosts, CONFIG.POLL_INTERVAL);
fetchPosts();

process.on('message', function(message) {
	if(message == 'shutdown')
		process.exit(0);
});

if(process.send)
	process.send('online');

