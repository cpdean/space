var context;
var canvas;
var bro;
var stars;
var planets = []
var frame_tick = 20;

function rand_color(){

	var color = "#";
	var i;

	for(i=0;i<3;i++){

		color += (Math.floor(Math.random()*210) + 20).toString(16);
	}
	return color;
}

function Trace(x,y,color){
        this.x = x;
        this.y = y;
        this.r = 2;
        this.color = color || "#ff0000";

	this.draw = function(){
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x,this.y,this.r,0,Math.PI*2,true);
		context.closePath();
		context.fill();
	};	

}

function Body(x, y, radius, vx, vy, color, mass){

	this.x = x;
	this.y = y;
	this.r = radius;
        this.speed = {x : vx,
                      y : vy};
	this.color = color;
        this.traces = [];

        this.topbottom_colliding = function(x){
                return this.x - this.r <= 0
                    || this.x + this.r >= canvas.width;
        };

        this.rightleft_colliding = function(x){
                return this.y - this.r <= 0
                    || this.y + this.r >= canvas.height;
        };

        this.directional_vector = function(other_body){
                // returns a vector that points to the other body
                var x_component = other_body.x - this.x;
                var y_component = other_body.y - this.y;

                return {x : x_component,
                        y : y_component};
        };

        this.magnitude_of = function(v){
                var m = v.x*v.x + v.y*v.y;
                m = Math.abs(m);
                m = Math.sqrt(m);
                return m;
        };

        this.scalar_multiply = function(vector, scalar){
                var new_v = {}
                for(var component in vector){
                        new_v[component] = vector[component] * scalar;
                }
                return new_v;
        }

        this.unit_vector_of = function(v){
                //find magnitude of vector
                var m = this.magnitude_of(v);
                //divide vector by its magnitude
                m = 1/m;
                var new_v = this.scalar_multiply(v,m);
                return new_v;
        }


        this.distance_to = function(planet){
                return this.magnitude_of(
                        this.directional_vector(planet)
                );
        };

        this.gravitational_decay = function(planet){
                var distance = this.distance_to(planet);
                return 1/distance;
        };

        this.apply_vector = function(v1, v2){
                var new_v = {};
                for(var i in v1){
                        new_v[i] = v1[i] + v2[i];
                }
                return new_v;
        };

        this.is_planet_colliding = function(p){
                var distance = this.distance_to(p);
                var radii = this.r + p.r;
                return distance < radii;
        };

        this.colliding_from = function(p){
                var d_to_p = this.directional_vector(p);
                d_to_p.x = Math.abs(d_to_p.x);
                d_to_p.y = Math.abs(d_to_p.y);
                var x = d_to_p.x > d_to_p.y;
                var y = !x;
                return {from_x : x, from_y : y};
        };

        this.update_position = function(vector){
                this.x = this.x + vector.x;
                this.y = this.y + vector.y;
        }

        this.clipping_distance = function(p){
                var distance = this.distance_to(p);
                var radii = this.r + p.r;
                return radii - distance;
        };

        this.orthogonal_vector = function(v){
                var new_v = {}
                new_v.x = v.y
                new_v.y = v.x*-1;
                return new_v;
        };

        this.reflecting_matrix = function(reflector){
                // http://en.wikipedia.org/wiki/Transformation_matrix#Reflection
                var u = this.magnitude_of(reflector);
                u = u*u;
                u = 1/u;
                var x = reflector.x;
                var y = reflector.y;
                var matrix = [[x*x - y*y, 2*x*y], [2*x*y, y*y - x*x]];
                for (var row in matrix){
                        for(var col in matrix[row]){
                                matrix[row][col] = matrix[row][col] * u;
                        }
                }
                return matrix;
        };

        this.reflect_vector_with = function(vector, reflector){
                var r_matrix = this.reflecting_matrix(reflector);
                var x = vector.x;
                var y = vector.y;
                var new_v = {};
                new_v.x = r_matrix[0][0]*x + r_matrix[0][1]*y;
                new_v.y = r_matrix[1][0]*x + r_matrix[1][1]*y;
                return new_v;
        };

	this.move = function(){
                if(this.topbottom_colliding()) this.speed.x *= -1;
                if(this.rightleft_colliding()) this.speed.y *= -1;


                //collision detection for planets
                for(var p in planets){
                        if(this.is_planet_colliding(planets[p])){
                                var normal_vector = this.directional_vector(planets[p]);
                                var reflecting_vector = this.orthogonal_vector(normal_vector);
                                this.speed = this.reflect_vector_with(this.speed,reflecting_vector);
                                this.speed = this.scalar_multiply(this.speed, 0.996); // rub rub

                                // handle clipping. reposition agent 
                                // so it's no longer overlapping with
                                // this planet
                                var clipping = this.clipping_distance(planets[p]);
                                var direction_to_correct = this.directional_vector(planets[p]);
                                var correction = this.unit_vector_of(direction_to_correct);
                                correction = this.scalar_multiply(correction, -clipping);


                                this.update_position(correction);

                        }
                }


                for(var p in planets){
                        var d = this.directional_vector(planets[p]);
                        d = this.unit_vector_of(d);
                        d = this.scalar_multiply(d, 10);
                        var decay = this.gravitational_decay(planets[p]);
                        d = this.scalar_multiply(d, decay);
                        this.speed = this.apply_vector(this.speed,d);
                }

                var out = "speed";
                out = out + "\n<br>";
                out = out + this.speed.x;
                out = out + "\n<br>";
                out = out + this.speed.y;
                out = out + "\n<br>";
                out = out + this.magnitude_of(this.speed);
                out = out + "\n<br>";
                out = out + "tracers ";
                out = out + this.traces.length;
                out = out + "\n<br>";
                out = out + "pos: ";
                out = out + "\n<br>";
                out = out + this.x;
                out = out + "\n<br>";
                out = out + this.y;
                out = out + "\n<br>";
                out = out + "pull: " + this.magnitude_of(d);
                out = out + "\n<br>";
                out = out + "decay: " + this.gravitational_decay(planets[p]);
                document.getElementById("log").innerHTML = out;

                this.update_history();
                this.update_position(this.speed);
	};

        this.heat_of = function(){

                // range is #00ff00 to #ffff00 to #ff0000

                //range is defined by two ranges
                // ff00 = 65280 is 7
                // ffff = 65535 is 4
                // 00ff = 255   is 0

                var b = "00";
                var intensity = this.magnitude_of(this.speed);
                if(intensity > 4){
                        return "#ff00" + b;
                }
                if(intensity <= 4){
                        return "#00ff" + b;
                }
        };
        this.update_history = function(){
                if(this.traces.length > 1500){
                        this.traces = this.traces.slice(1000);
                }
                this.traces.push(new Trace(this.x, this.y, this.heat_of()));
        };

	this.draw = function(){
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x,this.y,this.r,0,Math.PI*2,true);
		context.closePath();
		context.fill();
                for(var i in this.traces){
                        this.traces[i].draw();
                }
	};	

}

function game_loop(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	for(var i=0;i<stars.length;i++){
		stars[i].draw();
	}
        for(var i in planets){
                planets[i].draw();
        }
	bro.move();
	bro.draw();

}

function init(){

	canvas = document.getElementById('SpaceCanvas');
	context = canvas.getContext('2d');
        planets.push(new Body(250, 200, 20, 2, 7, rand_color(), 10));
        // simple float around
	bro = new Body(90, 66, 20, -1.5, 2, rand_color(), 0);

        // demonstrate collision detection, head-on
	//bro = new Body(250, 150, 20, 0, 0, rand_color(), 0);

        // demonstrate collision detection, head on,
        // slightly to side. demonstrate normal vector
        // for collision calculation.
	//bro = new Body(260, 160, 20, 0, 2, rand_color(), 0);

        stars = generate_star_clusters();
	setInterval(game_loop, frame_tick);
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
			stars.push(new Body(sx,sy,1,0,0,"#ffffff"));
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

