var canvas = null;
var stage = null;
var me = null;
var meCircle = null;
var meShield = null;
var others = {};
var bombs = {};
var foods = {};
var items = {};												///////////////////////////////
var othersContainer = null;
var itemsContainer = null;
var bombsContainer = null;
var foodsContainer = null;
var dynamicContainer = null;
var staticContainer = null;

var keys = new Array(128);
var socket;
var oldX, oldY;
var mapWidth = 2000, mapHeight = 2000;
var speed = 0;
var isUpsideDown = 0;
var isCobweb = 0;

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
	itemsContainer = new createjs.Container();									//////////////////////////////////////
	dynamicContainer.addChild(itemsContainer);
	othersContainer = new createjs.Container();
	dynamicContainer.addChild(othersContainer);
	staticContainer = new createjs.Container();
	stage.addChild(staticContainer);

	me = new createjs.Container();
	meCircle = new createjs.Shape();
	meCircle.graphics.ss(3).s('black').f('DeepSkyBlue').drawCircle(0, 0, 25);
	meShield = new createjs.Shape();
	meShield.graphics.ss(5).s('green').ef().drawCircle(0, 0, 25);
	meShield.alpha = 0;
	me.x = mapWidth / 2;
	me.y = mapHeight / 2;

	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
	document.addEventListener('keyup', function (event) {
		keys[event.keyCode] = false;
	});

	createjs.Ticker.addEventListener('tick', tick);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;

	socket = io();
	socket.on('quit', recvQuit);
	socket.on('position', recvPositionInfo);
	socket.on('setBomb', recvSetBomb);
	socket.on('explosion', recvExplosion);
	socket.on('kill', recvKill);
	socket.on('status', recvStatus);
	socket.on('gameOver', recvGameOver);
	socket.on('foodSpawn', recvFoodSpawn);
	socket.on('foodEaten', recvFoodEaten);
	socket.on('leaderboard', recvLeaderboard);
	socket.on('UFO', recvUFO);																				///////////////
	socket.on('itemEaten', recvItemEaten);														////////////////////
	socket.on('gotBuff', recvGotBuff);											//////////////////////
	socket.on('noTurtle', recvNoTurtle);																		////////////////////////////
	socket.on('itemsSpawn', recvItemsSpawn);

	document.getElementById('playerNameInput').addEventListener('keypress', function (event) {
		var keyCode = (event.keyCode ? event.keyCode : event.which);
		if (keyCode == 13)
			join();
	});
	$('button.teal').on('click', function () {
		sendUpgrade('maxBombs');
		$('button').blur();
	});
	$('button.red').on('click', function () {
		sendUpgrade('power');
		$('button').blur();
	});
	$('button.yellow').on('click', function () {
		sendUpgrade('speed');
		$('button').blur();
	});
}

function recvGotBuff(data) {	//////////////////////////////////////////////////////////////////          ///////////////////////////////
	if (data.type == 0) {	//cobweb
		isCobweb++;
		setTimeout(function () {
			isCobweb--;
		}, 3000);
	} else if (data.type == 1) {	//turtle
		createjs.Tween.get(meShield)
			.to({alpha: 0, scaleX: 2, scaleY: 2})
			.to({alpha: 1, scaleX: 1, scaleY: 1}, 300);
	} else {	//upsideDown
		isUpsideDown++;
		setTimeout(function () {
			isUpsideDown--;
		}, 5000);
	}

	recvItemEaten(data.id);
}

function recvNoTurtle() {		///////////////////////////////////////// //////// /////////////////////////////
	createjs.Tween.get(meShield).to({alpha: 0, scaleX: 2, scaleY: 2}, 300);
}

function recvItemEaten(id) {	////////////////////////////////////////////////////////////////////        ///////////////////////////
	itemsContainer.removeChild(items[id]);
	delete items[id];
}

function recvItemsSpawn(data) {  ////////////////////////////////////////////////////////////////////////////////////////////////////////
	var item = new createjs.Shape();
	if (data.type == 0) {
		item.graphics.ss(3).s('white').ef().drawCircle(0, 0, 15).s('white').drawPolyStar(0, 0, 10, 8, 1, 22.5);
	} else if(data.type == 1) {
		item.graphics.ss(3).s('white').ef().drawCircle(0, 0, 15).s('white').f('green').drawPolyStar(0, 0, 10, 6, 0, 0);
	} else {
		item.graphics.ss(3).s('white').ef().drawCircle(0, 0, 15).s('red').drawPolyStar(0, 0, 10, 4, 1, 45);
	}
	item.x = data.x;
	item.y = data.y;
	item.alpha = 0;
	itemsContainer.addChild(item);
	items[data.id] = item;
	createjs.Tween.get(item).to({alpha: 1}, 800);
}

function recvUFO(UFOy) {	////////////////////////////////////////////////////////////////////////         //////////////////////////////
	var UFO = new createjs.Shape();
	UFO.graphics.ss(3).s('black').f('aqua').drawCircle(-40, 18, 17);
	UFO.graphics.ss(3).s('black').f('aqua').drawCircle(0, 23, 17);
	UFO.graphics.ss(3).s('black').f('aqua').drawCircle(40, 18, 17);
	UFO.graphics.ss(3).s('black').f('gray').drawEllipse(-80, -17, 160, 40);
	UFO.graphics.ss(3).s('black').f('aqua').drawEllipse(-53, -9, 106, 18);	//mid line
	UFO.graphics.ss(3).s('black').f('aqua').arc(0, 0, 53, Math.PI, 0);	//up circle
	UFO.graphics.ss(3).s('black').ef().arc(40, -53, 40, Math.PI, Math.PI*1.3);
	UFO.graphics.ss(3).s('black').f('aqua').drawCircle(20, -87, 8);
	UFO.x = 5000;
	UFO.y = UFOy;
	itemsContainer.addChild(UFO);

	createjs.Tween.get(UFO).to({ alpha: 0, x: 2200 }, 1)
							.to({ alpha: 1, x: 2000 }, 700, createjs.Ease.getPowInOut(2))
							.to({ x: 1000 }, 3000)
							.to({ x: 0}, 3000, createjs.Ease.getPowInOut(2))
							.to({ alpha: 0, x: -200}, 700);

	// for (var i = 0; i < 10; i++) {
	// 	recvItemsSpawn(data[i]);
	// }
}

function join() {
	me.x = Math.random() * mapWidth | 0;
	me.y = Math.random() * mapHeight | 0;
	var myName = document.getElementById('playerNameInput').value;
	var ts = new createjs.Text(myName, '12pt Lato', 'black');
	ts.outline = 3;
	ts.textAlign = 'center';
	ts.textBaseline = 'middle';
	var tf = new createjs.Text(myName, '12pt Lato', 'White');
	tf.textAlign = 'center';
	tf.textBaseline = 'middle';
	me.addChild(meCircle, meShield, ts, tf);
	dynamicContainer.addChild(me);

	socket.emit('join', {
		name: myName,
		x: me.x,
		y: me.y
	});
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keypress', handleKeyPress);
	document.getElementById('startMenu').style.zIndex = -1;
	document.getElementById('playerNameInput').disabled = true;
	$('.panel').css('z-index', 1);
}

function die() {
	document.removeEventListener('keydown', handleKeyDown);
	document.removeEventListener('keypress', handleKeyPress);
	for (var i = 0; i < keys.length; i++)
		keys[i] = false;
	dynamicContainer.removeChild(me);
	document.getElementById('startMenu').style.zIndex = 1;
	document.getElementById('playerNameInput').disabled = false;
	$('.panel').css('z-index', -1);
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
	var d;
	if (!isCobweb) {								//////////////////////////////////////////////////////////////
		d = event.delta * (0.18 + speed * 0.03);
	} else {
		d = event.delta * (0.1);
	}
	if (isUpsideDown)
		d = -d;
	if (keys[37])
		me.x = Math.max(me.x - d, 0);
	else if (keys[38])
		me.y = Math.max(me.y - d, 0);
	else if (keys[39])
		me.x = Math.min(me.x + d, mapWidth - 1);
	else if (keys[40])
		me.y = Math.min(me.y + d, mapHeight - 1);
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
			x: Math.round(me.x),
			y: Math.round(me.y)
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
		var ts = new createjs.Text(data.name, '12pt Lato', 'black');
		ts.outline = 3;
		ts.textAlign = 'center';
		ts.textBaseline = 'middle';
		var tf = new createjs.Text(data.name, '12pt Lato', 'White');
		tf.textAlign = 'center';
		tf.textBaseline = 'middle';
		con.x = data.x;
		con.y = data.y;
		con.addChild(c, ts, tf);
		othersContainer.addChild(con);
		others[data.id] = con;
	} else {
		createjs.Tween.get(others[data.id]).to({x: data.x, y: data.y}, 15);
		// others[data.id].x = data.x;
		// others[data.id].y = data.y;
	}
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
	var X = [-50, 0, 50, 0], Y = [0, -50, 0, 50];
	for (var i = 0; i <= data.power; i++) {
		for (var j = 0; j < 4; j++) {
			var fire = new createjs.Shape();
			fire.graphics.f('yellow').drawRoundRect(0, 0, 50, 50, 10);
			fire.x = data.x + X[j] * i;
			fire.y = data.y + Y[j] * i;
			bombsContainer.addChild(fire);
			createjs.Tween.get(fire)
				.wait(500)
				.to({alpha: 0}, 100)
				.call(function () {
					bombsContainer.removeChild(fire);
				});
		}
	}
	if (data.id in bombs) {
		bombsContainer.removeChild(bombs[data.id]);
		delete bombs[data.id];
	}
}

function recvKill(id) {
	if (id in others) {
		var s = others[id];
		createjs.Tween.get(s)
			.to({alpha: 0, scaleX: 1.5, scaleY: 1.5}, 400)
			.call(function () {
				othersContainer.removeChild(s);
			});
		delete others[id];
	}
}

function recvGameOver() {
	die();
}

function recvStatus(data) {
	$('div.teal.progress').progress({value:data.maxBombs, total:7, autoSuccess:false, showActivity:false});
	$('div.red.progress').progress({value:data.power, total:5, autoSuccess:false, showActivity:false});
	$('div.yellow.progress').progress({value:data.speed, total:7, autoSuccess:false, showActivity:false});
	$('div.olive.progress').progress({percent: (data.level % 1) * 100, autoSuccess:false, showActivity:false});
	$('#level').text('Level ' + (data.level | 0));
	$('#exp').text(Math.round(data.level * 100 % 100) + '%');
	if (data.skillPoint > 0) {
		$('button.ui').show();
	} else {
		$('button.ui').hide();
	}
	speed = data.speed;
	if (data.invulnerable > 0 && !createjs.Tween.hasActiveTweens(meCircle)) {
		var matrix = new createjs.ColorMatrix().adjustSaturation(50);
		var filter = new createjs.ColorMatrixFilter(matrix);
		createjs.Tween.get(meCircle, {loop: true})
			.to({filters: [filter]})
			.call(function () { meCircle.cache(-30, -30, 60, 60); })
			.wait(100)
			.to({filters: []})
			.call(function () { meCircle.cache(-30, -30, 60, 60); })
			.wait(100);
	} else if (data.invulnerable == 0) {
		createjs.Tween.removeTweens(meCircle);
		meCircle.filters = [];
		meCircle.cache(-30, -30, 60, 60);
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

function recvLeaderboard(data) {
	$('.ldb').remove();
	for (var i = 0; i < data.length; i++) {
		$('#leaderboard').append('<p class="ldb" id="ldb' + i + '"></p>');
		$('#ldb' + i).text('[' + (i + 1) + '] ' + data[i].name);
	}
}
