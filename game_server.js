module.exports = function (io) {
	
	var sockets = {};
	var bombId = 0;
	var bombs = {};
	var players = {};
	var foodCount = 0;
	var foodId = 0;
	var foods = {};

	setInterval(function () {
		if (foodCount >= 70)
			return;
		for (var i = 0; i < 10; i++) {
			var fid = foodId++;
			var food = {
				x: (Math.random() * 40 | 0) * 50 + 25,
				y: (Math.random() * 40 | 0) * 50 + 25
			};
			foods[fid] = food;
			food.id = fid;
			io.emit('foodSpawn', food);
			foodCount++;
		}
	}, 2000);

	io.on('connection', function (socket) {
		sockets[socket.id] = socket;
		for (var pid in players) {
			socket.emit('position', {
				id: pid,
				name: players[pid].name,
				x: players[pid].x,
				y: players[pid].y
			});
		}
		for (var fid in foods) {
			socket.emit('foodSpawn', {
				id: fid,
				x: foods[fid].x,
				y: foods[fid].y
			});
		}
		socket.on('disconnect', function () {
			io.emit('quit', socket.id);
		});
		socket.on('join', function (data) {
			players[socket.id] = {
				name: data.name,
				level: 1,
				bombs: 0,
				maxBombs: 1,
				power: 1,
				speed: 1,
				skillPoint: 5,  // for test
				x: data.x,
				y: data.y
			};
			socket.broadcast.emit('position', {
				id: socket.id,
				name: data.name,
				x: data.x,
				y: data.y
			});
			sendPlayerStatus(socket.id);
		});
		socket.on('position', function (data) {
			data.id = socket.id;
			if (data.id in players) {
				data.name = players[data.id].name;
				socket.broadcast.emit('position', data);
				players[data.id].x = data.x;
				players[data.id].y = data.y;
			}
		});
		socket.on('hello', function (data) {
			io.emit('hello', data);
		});
		socket.on('setBomb', function (data) {
			// data prop: x, y
			if (!(socket.id in players) || players[socket.id].bombs >= players[socket.id].maxBombs)
				return;
			var id = bombId++;
			players[socket.id].bombs++;
			bombs[id] = {
				pid: socket.id,
				x: (data.x / 50 | 0) * 50,
				y: (data.y / 50 | 0) * 50,
				power: players[socket.id].power
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
		socket.on('upgrade', function (data) {
			// data prop: type('maxBombs'|'power'|'speed')
			if (!(socket.id in players) || players[socket.id].skillPoint <= 0)
				return;
			if (data.type == 'maxBombs' || data.type == 'power' || data.type == 'speed') {
				if (players[socket.id][data.type] < 7) {
					players[socket.id].skillPoint--;
					players[socket.id][data.type]++;
				}
			}
			sendPlayerStatus(socket.id);
		});
	});

	function handleExplosion(id) {
		if (!(id in bombs))
			return;
		var b = bombs[id];
		if (b.pid in players)
			players[b.pid].bombs--;
		var power = b.power;
		var ranges = [
			{x1: b.x-50*power, y1: b.y, x2: b.x+50*(power+1), y2: b.y+50},
			{x1: b.x, y1: b.y-50*power, x2: b.x+50, y2: b.y+50*(power+1)}
		];
		io.emit('explosion', {id: id, power: power});
		delete bombs[id];

		for (id in players) {
			var p = players[id];
			if ((p.x >= ranges[0].x1 && p.y >= ranges[0].y1 && p.x < ranges[0].x2 && p.y < ranges[0].y2)
					|| (p.x >= ranges[1].x1 && p.y >= ranges[1].y1 && p.x < ranges[1].x2 && p.y < ranges[1].y2)) {
				sockets[id].broadcast.emit('kill', id);
				sockets[id].emit('gameOver');
				delete players[id];
			}
		}
		for (id in foods) {
			var f = foods[id];
			if ((f.x >= ranges[0].x1 && f.y >= ranges[0].y1 && f.x < ranges[0].x2 && f.y < ranges[0].y2)
					|| (f.x >= ranges[1].x1 && f.y >= ranges[1].y1 && f.x < ranges[1].x2 && f.y < ranges[1].y2)) {
				io.emit('foodEaten', id);
				if (b.pid in players) {
					playerGetExp(b.pid, 0.5);  // for test
					sendPlayerStatus(b.pid);
				}
				delete foods[id];
				foodCount--;
			}
		}
		for (id in bombs) {
			b = bombs[id];
			if ((b.x >= ranges[0].x1 && b.y >= ranges[0].y1 && b.x < ranges[0].x2 && b.y < ranges[0].y2)
					|| (b.x >= ranges[1].x1 && b.y >= ranges[1].y1 && b.x < ranges[1].x2 && b.y < ranges[1].y2)) {
				handleExplosion(id);
			}
		}
	}

	function playerGetExp(pid, exp) {
		var oldLevel = players[pid].level;
		players[pid].level += exp;
		if ((players[pid].level | 0) > (oldLevel | 0)) {  // level up
			players[pid].skillPoint++;
		}
	}

	function sendPlayerStatus(pid) {
		sockets[pid].emit('status', players[pid]);
	}
};