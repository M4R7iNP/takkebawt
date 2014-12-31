var https	= require('https'),
	url		= require('url'),
	CONFIG	= require('./config.json');

console.log('Takkebawt started', new Date());
setInterval(function() {
	console.log('Takkebawt fetching', new Date());
	var path = new url.Url();
	path.pathname = '/me/feed';
	path.query = {
		fields: 'from{first_name},to,message,comments{from},type',
		access_token: CONFIG.ACCESS_TOKEN,
		since: '30-12-2014'
		//until: '01-01-2014'
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
				console.error('Fatal error! Response did not contain field "data". Parsed response: ', jsonResponse);
			processCongratulations(jsonResponse.data);
		});
	});

	req.end();

	req.on('error', function(e){
		console.error(e);
	});
}, 10000);

function processCongratulations(data) {
	//console.log('MASSE GRATULATIONS:', data.length);
	for(var i = 0; i < data.length; i++) {
		var post = data[i];

		if(post.type != 'status' && post.type != 'photo')
			continue;

		if(!post.to || post.to.data[0].id != CONFIG.USER_ID)
			continue;

		if(post.comments && userHasAlreadyCommented(post.comments.data))
			continue;

		publishComment(post);
	}
}

function userHasAlreadyCommented(comments) {
	for(var i = 0; i < comments.length; i++)
		if(comments[i].from.id == CONFIG.USER_ID)
			return true;

	return false;
}

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

process.on('message', function(message) {
	if(message == 'shutdown')
		process.exit(0);
});

if(process.send)
	process.send('online');

