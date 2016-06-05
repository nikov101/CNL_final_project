module.exports = function (io) {
	
	io.on('connection', function (socket) {
		socket.on('position', function (data) {
			data.id = socket.id;
			socket.broadcast.emit('position', data);
		});
		socket.on('hello', function (data) {
			io.emit('hello', data);
		});
	});
};