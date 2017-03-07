// Server Side JavaScript
'use strict';

var express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, https = require('https')
	, qs = require('querystring')
	, path = require('path')
	, io = require('socket.io');

var fs = require('fs');
var app = express();
var server = http.createServer(app);
var io = io.listen(server);
var IMAGE_DIR = path.join(__dirname, 'public', 'images');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

//get access talk
function getAccessToken(callback) {
	let body = '';
	let data = {
		'client_id': 'XXXX',
		'client_secret': 'XXXXXXXX',
		'scope': 'http://api.microsofttranslator.com',
		'grant_type': 'client_credentials'
	};

	let req = https.request({
		host: 'datamarket.accesscontrol.windows.net',
		path: '/v2/OAuth2-13',
		method: 'POST'
	}, (res) => {
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			body += chunk;
		}).on('end', () => {
			let resData = JSON.parse(body);
			callback(resData.access_token);
		});
	}).on('error', (err) => {
		console.log(err);
	});
	req.write(qs.stringify(data));
	req.end();
}

//japanese -> English
function translate(token, text, callback) {
	let options = 'from=ja'+
		'&to=en' +
		'&text=' +
		qs.escape(text) +
		'&oncomplete=translated';
	let body = '';
	let req = http.request({
		host: 'api.microsofttranslator.com',
		path: '/V2/Ajax.svc/Translate?' + options,
		method: 'GET',
		headers: {
			"Authorization": 'Bearer ' + token
		}
	}, (res) => {
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			body += chunk;
		}).on('end', () => {
			eval(body);
		});
	}).on('error', (err) => {
		console.log(err);
	});
	req.end();

	function translated(text) {
		callback(text);
	}
}

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', function(req,res){
	res.render('index',{
		title: 'SlackLine'
	});
});

app.get('/:msg', function(req, res){
	if(typeof req.params.msg === 'undefined'){
		res.send(400);
		return;
	}
	fs.readFile(path.join(IMAGE_DIR , req.params.msg + '.jpg'), function(err, data){
		if(err){
			//console.error(err);
			//res.send(500);
			return;
		}
		//console.log(req.params.msg);
		res.set('Content-Type', 'image/jpg');
		res.send(data);
	});
});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

var count = 0;
var roomList = new Object();

io.sockets.on('connection', function(socket) {
	console.log("connected");
	console.log(roomList);
	count++;
	io.sockets.emit('count', count);

	socket.on("enter", function(rname){
		var rooms = io.sockets.manager.roomClients[socket.id];
		var roomsn = Object.keys(rooms);

		roomsn.forEach(function(room){

			if(roomsn[1] && room !==''){
				room = room.replace(/\//, '');
				socket.leave(room);
				roomList[room]--;
				if(roomList[room] <= 0){
					delete roomList[room];
					console.log(room + ' was deleted.');
				}
			}
		});

		if(!roomList[rname]){
			roomList[rname] = 1;
		}else{
			roomList[rname]++;
		}

		socket.join(rname);
		io.sockets.emit("roomList",roomList);
	});

	socket.on('msg post', function(msg) {
		var rooms = io.sockets.manager.roomClients[socket.id];
		var roomsn = Object.keys(rooms);

		//Message translation
		getAccessToken((token) => {
			translate(token, msg.text, (translated) => {
				console.log(msg.text,'->',translated);
			});
		});

		if(!roomsn[1] && roomsn[0] ===''){
			io.sockets.emit('msg push', {name: msg.name, text: msg.text});
		}else{
			roomsn.forEach(function (room){
				if(room !==''){
					room = room.replace(/\//, '');
					io.sockets.to(room).emit('msg push', {name: msg.name, text: msg.text});
				}
			});
		}
	});

	socket.on('disconnect', function(){
		count--;
		io.sockets.emit('count', count);
		var rooms = io.sockets.manager.roomClients[socket.id];
		var roomsn = Object.keys(rooms);

		roomsn.forEach(function(room){
			if(room !==''){
				room = room.replace(/\//,'');
				roomList[room]--;
				if(roomList[room] <= 0){
					delete roomList[room];
				}
			}
		});
		io.sockets.emit('roomList', roomList);
	});
});
