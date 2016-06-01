var canvas = null;
var stage = null;
var circle = null;
var circles = {};
var keys = new Array(128);
var socket = io('http://localhost:3000');
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
	this.document.onkeydown = function (event) {
		keys[event.keyCode] = true;
	};
	this.document.onkeyup = function (event) {
		keys[event.keyCode] = false;
	};
	this.document.onkeypress = function (event) {
		if (event.keyCode == 13)
			socket.emit('hello', {x: circle.x, y: circle.y});
	};
	
	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.setFPS(60);
	
	setInterval(sendPositionInfo, 30);
	socket.on('position', recvPositionInfo);
	socket.on('hello', recvHelloMsg);
}

function tick(event) {
	if (keys[37])
		circle.x -= 5;
	else if (keys[38])
		circle.y -= 5;
	else if (keys[39])
		circle.x += 5;
	else if (keys[40])
		circle.y += 5;
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
		// circle2.x = data.x;
		// circle2.y = data.y;
		createjs.Tween.get(circles[data.id]).to({x: data.x, y: data.y}, 30);
	}
}

function recvHelloMsg(msg) {
	var text = new createjs.Text('Hello', '20px Arial', 'Black');
	text.x = msg.x;
	text.y = msg.y;
	text.textAlign = 'center';
	text.textBaseline = 'middle';
	stage.addChild(text);
	setTimeout(function () {
		stage.removeChild(text);
	}, 1000);
}