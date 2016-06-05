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
		if (event.keyCode == 32)  // space
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

	var explosion = {
	   images: ["images/spritesheet-explosion.jpg"],
	   frames: {width:50, height:50},
	   animations: {
		   stand:0,
		   run:[1,5, "", 0.1],
		   jump:[6,8,"run"],
	   }
    };
    var spriteSheet = new createjs.SpriteSheet(explosion);
    var explosionAnim = new createjs.Sprite(spriteSheet, "run");
    explosionAnim.x = msg.x -25;
    explosionAnim.y = msg.y -25;
	stage.addChild(explosionAnim);

	var animationList = [];
	animationList.push(explosionAnim);

    setTimeout(function () {
		for (var i = 0; i < 3; i++) {	//explosion length
			for (var j = 0; j < 4; j++) {
				if (j == 0) {	// up
					var explosionAnim = new createjs.Sprite(spriteSheet, "run");
					explosionAnim.x = msg.x - 25;
					explosionAnim.y = msg.y - 25 + 60*(i+1);
				} else if (j == 1) {	// down
					var explosionAnim = new createjs.Sprite(spriteSheet, "run");
					explosionAnim.x = msg.x - 25;
					explosionAnim.y = msg.y - 25 - 60*(i+1);
				} else if (j == 2) {	// left
					var explosionAnim = new createjs.Sprite(spriteSheet, "run");
					explosionAnim.x = msg.x - 25 - 60*(i+1);
					explosionAnim.y = msg.y - 25;
				} else {	// right
					var explosionAnim = new createjs.Sprite(spriteSheet, "run");
					explosionAnim.x = msg.x - 25 + 60*(i+1);
					explosionAnim.y = msg.y - 25;
				}
				animationList.push(explosionAnim);
				stage.addChild(explosionAnim);
			}
		}
	}, 1000);

	setTimeout(function () {
		for (var i = 0; i < animationList.length; i++) {
			stage.removeChild(animationList[i]);
		}
	}, 2000);

	// var text = new createjs.Text('Hello', '20px Arial', 'Black');
	// text.x = msg.x;
	// text.y = msg.y;
	// text.textAlign = 'center';
	// text.textBaseline = 'middle';
	//stage.addChild(text);


	// createjs.Tween.get(text)
	// 	.wait(1000)
	// 	.to({alpha: 0, scaleX: 3, scaleY: 3}, 300)
	// 	.call(function () {
	// 		stage.removeChild(text);
	// 	});
	// setTimeout(function () {
	// 	stage.removeChild(text);
	// }, 1000);
}
