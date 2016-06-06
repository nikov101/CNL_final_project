var canvas = null;
var stage = null;
var me = null;
var line = null;
var circles = {};
var container = null;
var keys = new Array(128);
var socket = io();
var oldX, oldY;
var mapWidth = 2000, mapHeight = 2000;

function init() {
	stage = new createjs.Stage('canvas');
	canvas = document.getElementById('canvas');
	//stage.autoClear = false;
	
	//canvas.style.background = '#000';

	container = new createjs.Container();
	canvas.style.background = '#708090';
	drawGridLines();

	me = new createjs.Shape();
	me.graphics.ss(3).s('black').f('DeepSkyBlue').drawCircle(0, 0, 25);
	me.x = mapWidth / 2;
	me.y = mapHeight / 2;
	container.addChild(me);
	stage.addChild(container);
	
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
	document.addEventListener('keydown', function (event) {
		if (event.keyCode >= 37 && event.keyCode <= 40) {
			for (var i = 37; i <= 40; i++)
				keys[i] = false;
		}
		keys[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		keys[event.keyCode] = false;
	});
	document.addEventListener('keypress', function (event) {
		if (event.keyCode == 13)
			socket.emit('hello', {x: me.x, y: me.y});
	});
	
	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	
	socket.on('position', recvPositionInfo);
	socket.on('hello', recvHelloMsg);
}

function drawGridLines(){
	line = new createjs.Shape();
	line.graphics.ss(1).s('black');
	for (var i = 0; i <= mapWidth; i += 50) {
		line.graphics.mt(i, 0).lt(i, mapHeight);
	}
	for (var i = 0; i <= mapHeight; i += 50) {
		line.graphics.mt(0, i).lt(mapWidth, i);
	}
   	container.addChild(line);
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

	container.x = canvas.width / 2 - me.x;
	container.y = canvas.height / 2 - me.y;
	
	sendPositionInfo();
	stage.update();
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
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
	if (!(data.id in circles)) {
		var c = new createjs.Shape();
		c.graphics.ss(3).s('black').f('Pink').drawCircle(0, 0, 30);
		c.x = data.x;
		c.y = data.y;
		circles[data.id] = c;
		container.addChild(c);
	} else {
		// createjs.Tween.get(circles[data.id]).to({x: data.x, y: data.y}, 10);
		circles[data.id].x = data.x;
		circles[data.id].y = data.y;
	}
}

function recvHelloMsg(msg) {
	var text = new createjs.Text('Hello', '20px Arial', 'White');
	text.x = msg.x;
	text.y = msg.y;
	text.textAlign = 'center';
	text.textBaseline = 'middle';
	container.addChild(text);
	createjs.Tween.get(text)
		.wait(1000)
		.to({alpha: 0, scaleX: 3, scaleY: 3}, 300)
		.call(function () {
			container.removeChild(text);
		});
}