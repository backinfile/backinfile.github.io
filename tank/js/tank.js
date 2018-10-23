

(function($) {
	var keystate = {};
	document.onkeydown = function(event) {
		var e = event || window.event || arguments.callee.caller.arguments[0];
		keystate[e.keyCode] = true;
	}
	document.onkeyup = function(event) {
		var e = event || window.event || arguments.callee.caller.arguments[0];
		keystate[e.keyCode] = false;
	}
	$.keystate = keystate;
})($);


function randInt(min, max) {return Math.floor(Math.random()*(max-min+1)+min);}

var Sun = (function() {
	function Sun(width, height) {
		this.time = randInt(0,23);
		this.barriers = [];
		this.width = width;
		this.height = height;
	}
	Sun.prototype = {
		getPos: function() {
			var radian = ((this.time%6)/6*Math.PI*2);
			var light = (12-Math.abs(12-this.time))/12*255;
			var color = 'rgb('+light+','+light+','+light+')';
			var cos = Math.cos(radian);
			var sin = Math.sin(radian);
			var r = Math.sqrt(this.width*this.width+this.height*this.height)/2;
			var p = [this.width/2+cos*r, this.height/2+sin*r];
			p.color = color;
			p.r = r;
			return p;
		},
		hookBarrier: function(barriers){
			this.barriers = barriers;
		},
		_light: function(cur_pos,color) {
			var points = this.barriers;
			var radians = [];
			for (var j=0; j<this.barriers.length; j++) {
				var polygon = this.barriers[j].polygon;
				for (var k=0; k<polygon.length; k++) {
					var pos = this.barriers[j].polygon[k];
					var radian = (Math.atan2(pos[1]-cur_pos[1],pos[0]-cur_pos[0]));
					radians.push(radian,radian+0.00001,radian-0.00001);
				}
			}
			var closest_poses = [];
			for (var i=0; i<radians.length; i++) {
				var radian = radians[i];
				var cos = Math.cos(radian);
				var sin = Math.sin(radian);
				var next_pos = [cur_pos[0]+cos,cur_pos[1]+sin];
				var ray = [cur_pos, next_pos];
				var closest_pos = null;
				for (var j=0; j<this.barriers.length; j++) {
					var polygon = this.barriers[j].polygon;
					for (var k=0; k<polygon.length; k++) {
						var posa = this.barriers[j].polygon[(k-1+polygon.length)%polygon.length];
						var posb = this.barriers[j].polygon[k];
						var interpos = getIntersection(ray, [posa, posb]);
						if (!interpos) continue;
						var tx = interpos[0]-cur_pos[0];
						var ty = interpos[1]-cur_pos[1];
						var dist = Math.sqrt(tx*tx+ty*ty);
						interpos.dist = dist;
						interpos.radian = radian;
						if (!closest_pos || dist < closest_pos.dist)
							closest_pos = interpos;
					}
				}
				if (closest_pos) {
					closest_poses.push(closest_pos);
				}
			}
			sorted_poses = closest_poses.sort(function(a,b) {
				return a.radian-b.radian;
			});
			sorted_poses.drawPolygon(color,true);
		},
		light: function(cur_pos, color, shake=10) {
			this._light(cur_pos, color);
			var n = 3;
			for (var i=0; i<n; i++) {
				var radian = Math.PI*2*i/n;
				var cos = Math.cos(radian);
				var sin = Math.sin(radian);
				this._light([cur_pos[0]+cos*shake,cur_pos[1]+sin*shake],"rgba(255,255,255,0.3)");
			}
		},
		update: function() {
			this.time += 0.001;
			this.time %= 24;
		},
		render: function(ctx) {
			var cur_pos = this.getPos();
			this.light(cur_pos, 'white', 10);
		}
	}
	return Sun;
})();

var Tank = (function () {
	function Tank(pos, type='base') {
		this.pos = pos || [100, 100];
		this.rotate = 0;
		this.piperotate = 0;
		this.type = 'base';
		this.size = 50;
		this.canvas = document.createElement('canvas');
		this.canvas.width = $.width;
		this.canvas.height = $.height;
		this.ctx = this.canvas.getContext('2d');
		this._render(this.ctx);
	}
	Tank.prototype = {
		getPos: function() {return this.pos;},
		getRotate: function() {return this.rotate;},
		getPipeRoate: function() {return this.piperotate;},
		getPolygon: function(coe=1) {
			var polygon = [];
			var dx = [1,1,-1,-1];
			var dy = [1.2,-1.2,-1.2,1.2];
			var pos = this.getPos();
			if (coe == 1) {
				var rotate = this.getRotate();
			} else {
				var rotate = this.getPipeRoate();
			}
			for (var i=0; i<4; i++) {
				var tp = [pos[0]+dx[i]*this.size*coe/2,pos[1]+dy[i]*this.size*coe/2]
					.rotate(rotate);
				polygon.push(tp);
			}
			return polygon;
		},
		getPipe: function() {
			var pos = this.getPos();
			var protate = this.getPipeRoate();
			return [[pos[0]-this.size/15,pos[1]].rotate(protate),
					[pos[0]+this.size/15,pos[1]].rotate(protate),
					[pos[0]+this.size/15,pos[1]-this.size*3/4].rotate(protate),
					[pos[0]-this.size/15,pos[1]-this.size*3/4].rotate(protate)];
		},
		_render: function(ctx=null) {
			ctx.beginPath();
			ctx.fillStyle = 'white';
			ctx.fillRect(0,0,$.width,$.height);
			this.getPolygon().drawPolygon('#333', true, 20, ctx);
			this.getPolygon(0.6).drawPolygon('#333', true, 5, ctx);
			this.getPipe().drawPolygon('#333', true, 5, ctx);
		},
		render: function(ctx=null) {
			var pos = this.getPos();
			ctx.drawImage(this.canvas,0,0);
		},
		update: function() {
			var speed = 1;
			if ($.keystate['W'.charCodeAt()]) {
				this.pos[1] -= speed;
			} else if ($.keystate['A'.charCodeAt()]) {
				this.pos[0] -= speed;
			} else if ($.keystate['S'.charCodeAt()]) {
				this.pos[1] += speed;
			} else if ($.keystate['D'.charCodeAt()]) {
				this.pos[0] += speed;
			}
		}
	};
	return Tank;
})();

var Barrier = (function() {
	function Barrier(polygon) {
		this.polygon = polygon;
	}
	Barrier.prototype = {
		render: function() {
			this.polygon.drawPolygon('white', false);
		}
	};
	return Barrier;
})();


window.onload = function () {
	var canvas = document.createElement('canvas');
	var width = window.innerWidth;
	var height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
	canvas.style.backgroundColor = 'black';
	document.body.appendChild(canvas);
	var ctx = canvas.getContext('2d');
	var mouse = $.getMouseState(canvas);
	$.ctx = ctx;
	$.width = width;
	$.height = height;
	Array.prototype.drawPolygon = function (color, isfill=true, shadowBlur=0, ictx=null) {
		var ctx = ictx || $.ctx;
		ctx.beginPath();
		ctx.moveTo(this[0][0],this[0][1]);
		for(var i=1;i<this.length;i++){
			ctx.lineTo(this[i][0],this[i][1]);
		}
		ctx.closePath();
		ctx.shadowBlur=shadowBlur;
		ctx.shadowColor='white';
		if (isfill) {
			ctx.fillStyle = color;
			ctx.fill();
		} else {
			ctx.lineWidth = 2;
			ctx.strokeStyle = color;
			ctx.stroke();
		}
	}
	
	var barriers = (function(segments) {
		segments.push([[-width,-height],[2*width,-height],[2*width,2*height],[-width,2*height]]);
		var barriers = [];
		for(var i=0; i<segments.length; i++) {
			barriers.push(new Barrier(segments[i]));
		}
		return barriers;
	})(segments);
	
	var enemyes = (function() {
		var e = [];
		var poses = [[400,300]];
		for (var i=0; i<poses.length; i++) {
			e.push(new Tank(poses[i]));
		}
		return e;
	})();
	
	var sun = new Sun(width, height);
	sun.hookBarrier(barriers);
	
	var player = new Tank([400,200]);
	$.animationFrame(function () {
		(function update() {
			sun.update();
			//player.update();
		})();
		(function render() {
			ctx.clearRect(0,0,width,height);
			for(var i=0; i<barriers.length; i++) {
				barriers[i].render();
			}
			sun.render();
			ctx.globalCompositeOperation = "source-in";
			//sun.light(player.getPos(), 'rgba(255,255,255,0.8)');
			/* ctx.beginPath();
			ctx.fillStyle = 'white';
			ctx.fillRect(0,0,width,height); */
			for (var i=0; i<enemyes.length; i++) {
				enemyes[i].render(ctx);
			}
			ctx.globalCompositeOperation = "source-over";
			//player.render();
		})();
	});
}

var segments = [
	[[100,150],[120,50],[200,80],[140,210]],
	[[100,200],[120,250],[60,300]],
	[[200,260],[220,150],[300,320]],
	[[540,60],[560,40],[570,70]],
	[[650,190],[760,170],[740,270],[630,290]],
	[[450,490],[760,470],[740,530],[640,530],[630,590]],
	[[600,95],[780,50],[680,150]]
];



function getIntersection(ray,segment,isray=true){
	var r_px = ray[0][0];
	var r_py = ray[0][1];
	var r_dx = ray[1][0]-ray[0][0];
	var r_dy = ray[1][1]-ray[0][1];
	var s_px = segment[0][0];
	var s_py = segment[0][1];
	var s_dx = segment[1][0]-segment[0][0];
	var s_dy = segment[1][1]-segment[0][1];
	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag) return null;
	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
	var T1 = (s_px+s_dx*T2-r_px)/r_dx;
	if(T1<0) return null;
	if (!isray && T1>1) return null;
	if(T2<0 || T2>1) return null;
	var tp = [r_px+r_dx*T1, r_py+r_dy*T1];
	tp.p = T1;
	return tp;
}





