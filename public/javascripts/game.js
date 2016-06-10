var canvas = null;
var stage = null;
var me = null;
var others = {};
var bombs = {};
var othersContainer = null;
var bombsContainer = null;
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
	bombsContainer = new createjs.Container();
	dynamicContainer.addChild(bombsContainer);
	othersContainer = new createjs.Container();
	dynamicContainer.addChild(othersContainer);
	staticContainer = new createjs.Container();
	stage.addChild(staticContainer);

	me = new createjs.Shape();
	me.graphics.ss(3).s('black').f('DeepSkyBlue').drawCircle(0, 0, 25);
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

	document.getElementById('playerNameInput').addEventListener('keypress', function (event) {
		var keyCode = (event.keyCode ? event.keyCode : event.which);
		if (keyCode == 13)
			join();
	});
}

function join() {
	me.x = mapWidth / 2;
	me.y = mapHeight / 2;
	dynamicContainer.addChild(me);
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keypress', handleKeyPress);
	document.getElementById('startMenu').style.zIndex = -1;
	document.getElementById('playerNameInput').disabled = true;
}

function die() {
	document.removeEventListener('keydown', handleKeyDown);
	document.removeEventListener('keypress', handleKeyPress);
	for (var i = 0; i < keys.length; i++)
		keys[i] = false;
	dynamicContainer.removeChild(me);
	document.getElementById('startMenu').style.zIndex = 1;
	document.getElementById('playerNameInput').disabled = false;
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
	if (keyCode == 13)  // Enter
		socket.emit('hello', {x: me.x, y: me.y});
	if (keyCode == 32)  // Space
		socket.emit('setBomb', {x: me.x, y: me.y, power: 3});
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

function recvPositionInfo(data) {
	if (!(data.id in others)) {
		var c = new createjs.Shape();
		c.graphics.ss(3).s('black').f('Pink').drawCircle(0, 0, 25);
		c.x = data.x;
		c.y = data.y;
		others[data.id] = c;
		othersContainer.addChild(c);
	} else {
		// createjs.Tween.get(others[data.id]).to({x: data.x, y: data.y}, 10);
		others[data.id].x = data.x;
		others[data.id].y = data.y;
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
	if (id.indexOf(socket.id) == -1) {		// id would contain some \#$%^
		// not me
		createjs.Tween.get(others[id])
			.to({alpha: 0, scaleX: 1.5, scaleY: 1.5}, 400)
			.call(function () {
				othersContainer.removeChild(others[id]);
			});
		delete others[id];
	} else {
		// is me
		die();
	}
}
