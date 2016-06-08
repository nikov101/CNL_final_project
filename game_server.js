module.exports = function (io) {
	
	var bombId = 0;
	io.on('connection', function (socket) {
		socket.on('position', function (data) {
			data.id = socket.id;
			socket.broadcast.emit('position', data);
		});
		socket.on('hello', function (data) {
			io.emit('hello', data);
		});
		socket.on('setBomb', function (data) {
			// data prop: x, y, power
			var id = bombId++;
			io.emit('setBomb', {
				id: id,
				x: (data.x / 50 | 0) * 50,
				y: (data.y / 50 | 0) * 50
			});
			setTimeout(function () {
				io.emit('explosion', {id: id, power: data.power});
			}, 2000);
		});
	});
};