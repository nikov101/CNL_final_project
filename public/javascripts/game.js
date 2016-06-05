var canvas = null;
var stage = null;
var circle = null;
var circles = {};
var keys = new Array(128);
var socket = io();
var oldX, oldY;

function init() {
	canvas = document.getElementById('canvas');
	stage = new createjs.Stage('canvas');
	circle = new createjs.Shape();
	circle.graphics.ss(3).s('black').f('DeepSkyBlue').drawCircle(0, 0, 30);
	circle.x = 200;
	circle.y = 200;
	stage.addChild(circle);
	
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
	document.addEventListener('keydown', function (event) {
		keys[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		keys[event.keyCode] = false;
	});
	document.addEventListener('keypress', function (event) {
		if (event.keyCode == 13)
			socket.emit('hello', {x: circle.x, y: circle.y});
	});
	
	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	// createjs.Ticker.setFPS(60);
	
	// setInterval(sendPositionInfo, 10);
	socket.on('position', recvPositionInfo);
	socket.on('hello', recvHelloMsg);
}

function tick(event) {
	var d = Math.round(event.delta * 0.3);
	if (keys[37])
		circle.x -= d;
	else if (keys[38])
		circle.y -= d;
	else if (keys[39])
		circle.x += d;
	else if (keys[40])
		circle.y += d;
	sendPositionInfo();
	stage.update();
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function sendPositionInfo() {
	if (circle.x != oldX || circle.y != oldY) {
		oldX = circle.x;
		oldY = circle.y;
		socket.emit('position', {
			x: circle.x,
			y: circle.y
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
		stage.addChild(c);
	} else {
		// createjs.Tween.get(circles[data.id]).to({x: data.x, y: data.y}, 10);
		circles[data.id].x = data.x;
		circles[data.id].y = data.y;
	}
}

function recvHelloMsg(msg) {
	var text = new createjs.Text('Hello', '20px Arial', 'Black');
	text.x = msg.x;
	text.y = msg.y;
	text.textAlign = 'center';
	text.textBaseline = 'middle';
	stage.addChild(text);
	createjs.Tween.get(text)
		.wait(1000)
		.to({alpha: 0, scaleX: 3, scaleY: 3}, 300)
		.call(function () {
			stage.removeChild(text);
		});
	// setTimeout(function () {
	// 	stage.removeChild(text);
	// }, 1000);
}