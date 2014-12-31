var https	= require('https'),
	url 	= require('url'),
	colors	= require('colors'),
	qs		= require('qs'),
	CONFIG	= require('./config.json');

if(!process.argv[2]){
	console.log('USAGE: node exhange_for_long_lived_token.js <SHORT_LIVED_TOKEN>');
	console.log('Refer to README.md');
	process.exit(1);
}

var path = new url.Url();
path.pathname = '/oauth/access_token';
path.query = {
	grant_type: 'fb_exchange_token',
	client_id: CONFIG.APP_ID,
	client_secret: CONFIG.APP_SECRET,
	fb_exchange_token: process.argv[2]
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
		var parsedBody = qs.parse(responseBody);
		if(!parsedBody.access_token)
			return console.error('Something went wrong!'.red, responseBody);

		console.log('Your long lived access token:'.cyan, parsedBody.access_token);
		console.log('It expires'.cyan, new Date(Date.now() + parseInt(parsedBody.expires)));
		console.log('Put this in your config.json'.cyan);
	});
});
req.end();
