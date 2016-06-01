module.exports = function (httpserver) {
	var io = require('socket.io')(httpserver);
	
	io.on('connection', function (socket) {
		socket.on('position', function (data) {
			console.log(socket.id + ' pos: ' + data.x + ' ' + data.y);
			data.id = socket.id;
			// io.emit('position', data);
			socket.broadcast.emit('position', data);
		});
		socket.on('hello', function (data) {
			io.emit('hello', data);
		});
	});
};