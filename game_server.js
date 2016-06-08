module.exports = function (io) {
	
	var bombId = 0;
	var bombs = {};

	io.on('connection', function (socket) {
		socket.on('disconnect', function () {
			io.emit('quit', {id: socket.id});
		});
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
			bombs[id] = {
				x: (data.x / 50 | 0) * 50,
				y: (data.y / 50 | 0) * 50,
				power: data.power
			};
			io.emit('setBomb', {
				id: id,
				x: (data.x / 50 | 0) * 50,
				y: (data.y / 50 | 0) * 50
			});
			setTimeout(function () {
				handleExplosion(id);
			}, 2000);
		});
	});

	function handleExplosion(id) {
		if (!(id in bombs))
			return;
		var b = bombs[id];
		var ranges = [
			{x1: b.x-50*b.power, y1: b.y, x2: b.x+50*(b.power+1), y2: b.y+50},
			{x1: b.x, y1: b.y-50*b.power, x2: b.x+50, y2: b.y+50*(b.power+1)}
		];
		io.emit('explosion', {id: id, power: b.power});
		delete bombs[id];
		for (id in bombs) {
			b = bombs[id];
			for (var i = 0; i < 2; i++) {
				if (b.x >= ranges[i].x1 && b.y >= ranges[i].y1 && b.x < ranges[i].x2 && b.y < ranges[i].y2) {
					handleExplosion(id);
					break;
				}
			}
		}
	}
};