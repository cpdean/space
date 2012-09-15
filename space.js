var context;
var canvas;
var bro;
var stars;
var planets = []
var frame_tick = 100;

function rand_color(){

	var color = "#";
	var i;

	for(i=0;i<3;i++){

		color += (Math.floor(Math.random()*210) + 20).toString(16);
	}
	return color;
}

function Body(x,y,radius,vx,vy,color){

	this.x = x;
	this.y = y;
	this.r = radius;
	this.vx = vx;
	this.vy = vy;
	this.color = color;

        this.topbottom_colliding = function(x){
                return this.x - this.r <= 0
                    || this.x + this.r >= canvas.width;
        };
        this.rightleft_colliding = function(x){
                return this.y - this.r <= 0
                    || this.y + this.r >= canvas.height;
        };

	this.move = function(){

                if(this.topbottom_colliding()) this.vx *= -1;
                if(this.rightleft_colliding()) this.vy *= -1;

		this.x = this.x + this.vx;
		this.y = this.y + this.vy;
	};

	this.draw = function(){
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x,this.y,this.r,0,Math.PI*2,true);
		context.closePath();
		context.fill();
	};	
}

function game_loop(){
	context.clearRect(0,0,canvas.width,canvas.height);
	for(i=0;i<stars.length;i++){
		stars[i].draw();
	}
	bro.move();
	bro.draw();

}

function init(){

	canvas = document.getElementById('SpaceCanvas');
	context = canvas.getContext('2d');
	planet =    new Body(10,26, 20, 2, 7, rand_color());
	bro = new Body(40,26,20,2,7,rand_color());
        stars = generate_star_clusters();
	setInterval(game_loop,frame_tick);
}

function generate_star_clusters(){

	var stars = [];
	var w = canvas.width;
	var h = canvas.height;

	var num_clusters = Math.floor(Math.random()*8)+5;

	for(i=0;i<num_clusters;i++){
		var num_stars = Math.floor(Math.random()*30) + 20;
		var x_mean = Math.floor(Math.random()*w);
		var y_mean = Math.floor(Math.random()*h);
		var std = Math.floor((Math.random()*2 + .20) * w);

		for(j=0;j<num_stars;j++){
			var sx = gauss(x_mean,std);
			var sy = gauss(y_mean,std);
			stars.push(new Body(sx,sy,2,0,0,"#ffffff"));
		}
	}
	return stars;
}


function gauss(mean, variance) {
	if (mean == undefined)
		mean = 0.0;
	if (variance == undefined)
		variance = 1.0;
	var V1, V2, S;
	do {
		var U1 = Math.random();
		var U2 = Math.random();
		V1 = 2 * U1 - 1;
		V2 = 2 * U2 - 1;
		S = V1 * V1 + V2 * V2;
	} while (S > 1);

	X = Math.sqrt(-2 * Math.log(S) / S) * V1;
	X = mean + Math.sqrt(variance) * X;
	return Math.floor(X);
}

