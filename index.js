var https	= require('https'),
	url		= require('url'),
	querystring	= require('querystring'),
	EventEmitter= require('events'),
	CONFIG	= require('./config.json'),
	DAY		= 24*60*60*1000,
	BIRTHDAY	= new Date(Math.floor(Date.now() / DAY) * DAY),
	API_VERSION	= 'v2.8';

console.log('Takkebawt started', new Date, 'for birthday', BIRTHDAY);

/**
 * helper function for http requests
 */
function request(path, postData) {
	var encodedPostData;

	var ev = new EventEmitter;

	if (postData) {
		encodedPostData = querystring.stringify(postData);
	}

	var req = https.request(
		{
			method: postData ? 'POST' : 'GET',
			hostname: 'graph.facebook.com',
			path: path.format(),
			headers: encodedPostData ? {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(encodedPostData)
			} : {}
		},
		function(res) {
			if (res.statusCode != 200) {
				return ev.emit('error', new Error('Status code was ' + res.statusCode));
			}

			res.setEncoding('utf8');

			var responseBody = '';
			res.on('data', data => responseBody += data);
			res.on('end', function() {
				var contentType = res.headers['content-type'];

				if (!/json|javascript/.test(contentType)) {
					return ev.emit('error', new Error('Unkown content type: ' + contentType));
				}

				var jsonResponse = JSON.parse(responseBody);
				if (!jsonResponse)
				{
					return ev.emit('error', new Error('Failed parsing json. Response: ', responseBody));
				}

				ev.emit('response', jsonResponse);
			});

		}
	);

	req.on('error', err => ev.emit('error', err));

	if (encodedPostData) {
		req.write(encodedPostData);
	}

	req.end();

	return ev;
}

/**
 * Poller function
 */
function fetchPosts() {
	console.log('Takkebawt fetching', new Date());

	var path = new url.Url();
	path.pathname = `/${API_VERSION}/me/feed`;
	path.query = {
		fields: 'from{first_name},to,message,comments{from},type',
		access_token: CONFIG.ACCESS_TOKEN,
		since: BIRTHDAY.toJSON()
	};

	var req = request(path);
	req.on('response', function(jsonResponse) {
		processCongratulations(jsonResponse.data);
	});
	req.on('error', err => console.error(err));
}

/**
 * Will find unthanked gratulations from given array of gratulations.
 */
function processCongratulations(data) {
	for(var i = 0; i < data.length; i++) {
		var post = data[i];

		if (['status', 'photo'].indexOf(post.type) === -1 ||
			(post.from && post.from.id == CONFIG.USER_ID) ||
			(post.to && post.to.data[0].id != CONFIG.USER_ID) ||
			(post.comments && userHasAlreadyCommented(post.comments.data)))
		{
			continue;
		}

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
	var message = 'Tusen takk, ' + post.from.first_name + '!  Godt nyttår! 🎉  🎂  🎈  ♥  🎊  ☺';
	console.log('Commented on ' + post.from.first_name + '\'s post');

	var path = new url.Url();
	path.pathname = `/${API_VERSION}/${post.id}/comments`;
	path.query = { access_token: CONFIG.ACCESS_TOKEN };

	var req = request(path, {
		message: message
	});

	req.on('response', function(response) {
		if (!response.id)
			console.error('Publish comment failed', response);
	});
	req.on('error', err => console.error(err));
}

setInterval(fetchPosts, CONFIG.POLL_INTERVAL);
fetchPosts();

process.on('message', function(message) {
	if(message == 'shutdown')
		process.exit(0);
});

if(process.send)
	process.send('online');

