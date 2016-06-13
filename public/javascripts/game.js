var canvas = null;
var stage = null;
var me = null;
var others = {};
var bombs = {};
var foods = {};
var othersContainer = null;
var bombsContainer = null;
var foodsContainer = null;
var dynamicContainer = null;
var staticContainer = null;

var keys = new Array(128);
var socket = io();
var oldX, oldY;
var mapWidth = 2000, mapHeight = 2000;

function init() {
	stage = new createjs.Stage('canvas');
	canvas = document.getElementById('canvas');

	dynamicContainer = new createjs.Container();
	stage.addChild(dynamicContainer);
	canvas.style.background = 'rgb(55,66,82)';
	drawGridLines();
	foodsContainer = new createjs.Container();
	dynamicContainer.addChild(foodsContainer);
	bombsContainer = new createjs.Container();
	dynamicContainer.addChild(bombsContainer);
	othersContainer = new createjs.Container();
	dynamicContainer.addChild(othersContainer);
	staticContainer = new createjs.Container();
	stage.addChild(staticContainer);

	me = new createjs.Container();
	meCircle = new createjs.Shape();
	meCircle.graphics.ss(3).s('black').f('DeepSkyBlue').drawCircle(0, 0, 25);
	me.x = mapWidth / 2;
	me.y = mapHeight / 2;
	
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
	document.addEventListener('keyup', function (event) {
		keys[event.keyCode] = false;
	});
	
	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	
	socket.on('quit', recvQuit);
	socket.on('position', recvPositionInfo);
	socket.on('hello', recvHelloMsg);
	socket.on('setBomb', recvSetBomb);
	socket.on('explosion', recvExplosion);
	socket.on('kill', recvKill);
	socket.on('status', recvStatus);
	socket.on('gameOver', recvGameOver);
	socket.on('foodSpawn', recvFoodSpawn);
	socket.on('foodEaten', recvFoodEaten);

	document.getElementById('playerNameInput').addEventListener('keypress', function (event) {
		var keyCode = (event.keyCode ? event.keyCode : event.which);
		if (keyCode == 13)
			join();
	});
	$('button.teal').on('click', function () {
		sendUpgrade('maxBombs');
	});
	$('button.red').on('click', function () {
		sendUpgrade('power');
	});
	$('button.yellow').on('click', function () {
		sendUpgrade('speed');
	});
}

function join() {
	me.x = mapWidth / 2;
	me.y = mapHeight / 2;
	var myName = document.getElementById('playerNameInput').value;
	var t = new createjs.Text(myName, '12pt Arial', 'White');
	t.textAlign = 'center';
	t.textBaseline = 'middle';
	me.addChild(meCircle, t);
	dynamicContainer.addChild(me);
	socket.emit('join', {
		name: myName,
		x: me.x,
		y: me.y
	});
	// setInterval(sendPositionInfo, 33);
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keypress', handleKeyPress);
	document.getElementById('startMenu').style.zIndex = -1;
	document.getElementById('playerNameInput').disabled = true;
	$('#statusPanel').css('z-index', 1);
}

function die() {
	document.removeEventListener('keydown', handleKeyDown);
	document.removeEventListener('keypress', handleKeyPress);
	for (var i = 0; i < keys.length; i++)
		keys[i] = false;
	dynamicContainer.removeChild(me);
	document.getElementById('startMenu').style.zIndex = 1;
	document.getElementById('playerNameInput').disabled = false;
	$('#statusPanel').css('z-index', -1);
	$('#playerNameInput').focus();
}

function drawGridLines(){
	var gridLine = new createjs.Shape();
	gridLine.graphics.ss(1).s('black');
	for (var i = 0; i <= mapWidth; i += 50) {
		gridLine.graphics.mt(i, 0).lt(i, mapHeight);
	}
	for (var i = 0; i <= mapHeight; i += 50) {
		gridLine.graphics.mt(0, i).lt(mapWidth, i);
	}
	gridLine.alpha = 0.5;
   	dynamicContainer.addChild(gridLine);
}

function tick(event) {
	var d = Math.round(event.delta * 0.3);
	if (keys[37])
		me.x = Math.max(me.x - d, 0);
	else if (keys[38])
		me.y = Math.max(me.y - d, 0);
	else if (keys[39])
		me.x = Math.min(me.x + d, mapWidth);
	else if (keys[40])
		me.y = Math.min(me.y + d, mapHeight);
	dynamicContainer.x = canvas.width / 2 - me.x;  // moving camera
	dynamicContainer.y = canvas.height / 2 - me.y;
	sendPositionInfo();
	stage.update();
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function handleKeyDown(event) {
	if (event.keyCode >= 37 && event.keyCode <= 40) {
		for (var i = 37; i <= 40; i++)
			keys[i] = false;
	}
	keys[event.keyCode] = true;
}

function handleKeyPress(event) {
	var keyCode = (event.keyCode ? event.keyCode : event.which);  // Firefox sucks!
	// if (keyCode == 13)  // Enter
	// 	socket.emit('hello', {x: me.x, y: me.y});
	if (keyCode == 32)  // Space
		socket.emit('setBomb', {x: me.x, y: me.y});
}

function recvQuit(id) {
	othersContainer.removeChild(others[id]);
	delete others[id];
}

function sendPositionInfo() {
	if (me.x != oldX || me.y != oldY) {
		oldX = me.x;
		oldY = me.y;
		socket.emit('position', {
			x: me.x,
			y: me.y
		});
	}
}

function sendUpgrade(type) {
	socket.emit('upgrade', {type: type});
}

function recvPositionInfo(data) {
	if (!(data.id in others)) {
		var con = new createjs.Container();
		var c = new createjs.Shape();
		c.graphics.ss(3).s('black').f('Pink').drawCircle(0, 0, 25);
		var t = new createjs.Text(data.name, '12pt Arial', 'White');
		t.textAlign = 'center';
		t.textBaseline = 'middle';
		con.x = data.x;
		con.y = data.y;
		con.addChild(c, t);
		othersContainer.addChild(con);
		others[data.id] = con;
	} else {
		createjs.Tween.get(others[data.id]).to({x: data.x, y: data.y}, 15);
		// others[data.id].x = data.x;
		// others[data.id].y = data.y;
	}
}

function recvHelloMsg(msg) {
	var text = new createjs.Text('Hello', '20px Arial', 'White');
	text.x = msg.x;
	text.y = msg.y;
	text.textAlign = 'center';
	text.textBaseline = 'middle';
	dynamicContainer.addChild(text);
	createjs.Tween.get(text)
		.wait(1000)
		.to({alpha: 0, scaleX: 3, scaleY: 3}, 300)
		.call(function () {
			dynamicContainer.removeChild(text);
		});
}

function recvSetBomb(data) {
	var bomb = new createjs.Shape();
	bomb.graphics.ss(3).s('black').f('white').drawRoundRect(0, 0, 50, 50, 20);
	bomb.x = data.x;
	bomb.y = data.y;
	bombs[data.id] = bomb;
	bombsContainer.addChild(bomb);
}

function recvExplosion(data) {
	var bomb = bombs[data.id];
	var X = [-50, 0, 50, 0], Y = [0, -50, 0, 50];
	for (var i = 0; i <= data.power; i++) {
		for (var j = 0; j < 4; j++) {
			var fire = new createjs.Shape();
			fire.graphics.f('yellow').drawRoundRect(0, 0, 50, 50, 10);
			fire.x = bomb.x + X[j] * i;
			fire.y = bomb.y + Y[j] * i;
			bombsContainer.addChild(fire);
			createjs.Tween.get(fire)
				.wait(500)
				.to({alpha: 0}, 100)
				.call(function () {
					bombsContainer.removeChild(fire);
				});
		}
	}
	bombsContainer.removeChild(bomb);
	delete bombs[data.id];
}

function recvKill(id) {
	// if (id.indexOf(socket.id) == -1) {		// id would contain some \#$%^
	// 	// not me
		var s = others[id];
		delete others[id];
		createjs.Tween.get(s)
			.to({alpha: 0, scaleX: 1.5, scaleY: 1.5}, 400)
			.call(function () {
				othersContainer.removeChild(s);
			});
	// } else {
	// 	// is me
	// 	die();
	// }
}

function recvGameOver() {
	die();
}

function recvStatus(data) {
	$('div.teal.progress').progress({value:data.maxBombs, total:7, autoSuccess:false, showActivity:false});
	$('div.red.progress').progress({value:data.power, total:7, autoSuccess:false, showActivity:false});
	$('div.yellow.progress').progress({value:data.speed, total:7, autoSuccess:false, showActivity:false});
	if (data.skillPoint > 0) {
		$('button.ui').show();
	} else {
		$('button.ui').hide();
	}
}

function recvFoodSpawn(data) {
	var f = new createjs.Shape();
	f.x = data.x;
	f.y = data.y;
	var angle = Math.random() * 180 | 0;
	if (angle % 3 == 0) {
		f.graphics.ss(2).s('black').f('greenyellow').drawPolyStar(0, 0, 15, 3, 0, angle);
	} else {
		f.graphics.ss(2).s('black').f('greenyellow').drawPolyStar(0, 0, 15, (angle % 3) + 4, 0, angle);
	}
	foods[data.id] = f;
	foodsContainer.addChild(f);
}

function recvFoodEaten(fid) {
	foodsContainer.removeChild(foods[fid]);
	delete foods[fid];
}