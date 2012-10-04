
(function(window,document){

  var frame_tick = 10;
  var canvas, context;

  function Trace(x,y,color){
    var trace = this;
    trace.x = x;
    trace.y = y;
    trace.r = 2;
    trace.color = color || "#ff0000";

    trace.draw = function(){
      context.beginPath();
      context.fillStyle = trace.color;
      context.arc(trace.x,trace.y,trace.r,0,Math.PI*2,true);
      context.closePath();
      context.fill();
    };	

  }

  function Vector(x,y){
    this.x = x;
    this.y = y;
  }

  Vector.prototype.get_magnitude = function(){
      var m = this.x*this.x + this.y*this.y;
      m = Math.abs(m);
      m = Math.sqrt(m);
      return m;
  };

  Vector.prototype.get_unit_vector = function(){
    //find magnitude of vector
    var m = this.get_magnitude();
    //divide vector by its magnitude
    m = 1/m;
    var new_v = this.scalar_multiply(m);
    return new_v;
  }

  Vector.prototype.scalar_multiply = function(scalar){
    var new_v = new Vector(0,0);
    new_v.x = this.x * scalar;
    new_v.y = this.y * scalar;
    return new_v;
  }

  Vector.prototype.apply_vector = function(v2){
    var new_v = new Vector(0,0);
    new_v.x = this.x + v2.x;
    new_v.y = this.y + v2.y;
    return new_v;
  };

  Vector.prototype.reflect_over = function(reflector){
    var reflecting_matrix = function(r){
      // http://en.wikipedia.org/wiki/Transformation_matrix#Reflection
      var u = r.get_magnitude();
      u = u*u;
      u = 1/u;
      var x = r.x;
      var y = r.y;
      var matrix = [[x*x - y*y, 2*x*y], [2*x*y, y*y - x*x]];
      for (var row in matrix){
        for(var col in matrix[row]){
          matrix[row][col] = matrix[row][col] * u;
        }
      }
      return matrix;
    };
    var r_matrix = reflecting_matrix(reflector);
    var x = this.x;
    var y = this.y;
    var new_v = new Vector(0,0);
    // matrix multiplication
    new_v.x = r_matrix[0][0]*x + r_matrix[0][1]*y;
    new_v.y = r_matrix[1][0]*x + r_matrix[1][1]*y;
    return new_v;
  };



  function Body(x, y, radius, vx, vy, color, mass, game){

    var body = this;

    body.x = x;
    body.y = y;
    body.canvas_x = body.x + game.camera_x;
    body.canvas_y = body.y + game.camera_y;
    body.r = radius;
    body.speed = new Vector(vx,vy);
    body.color = color;
    body.traces = [];

    body.topbottom_colliding = function(x){
      return body.x - body.r <= 0
        || body.x + body.r >= canvas.width;
    };

    body.rightleft_colliding = function(x){
      return body.y - body.r <= 0
        || body.y + body.r >= canvas.height;
    };

    body.directional_vector = function(other_body){
      // returns a vector that points to the other body
      var x_component = other_body.x - body.x;
      var y_component = other_body.y - body.y;

      return new Vector(x_component,y_component);
    };

    body.distance_to = function(planet){
      return body.directional_vector(planet).get_magnitude();
    };

    body.gravitational_decay = function(planet){
      var distance = body.distance_to(planet);
      return 1/distance;
    };

    body.is_planet_colliding = function(p){
      var distance = body.distance_to(p);
      var radii = body.r + p.r;
      return distance < radii;
    };

    body.update_position = function(vector){
      body.x = body.x + vector.x;
      body.y = body.y + vector.y;
    }

    body.clipping_distance = function(p){
      var distance = body.distance_to(p);
      var radii = body.r + p.r;
      return radii - distance;
    };

    body.orthogonal_vector = function(v){
      var new_v = new Vector(0,0);
      new_v.x = v.y
        new_v.y = v.x*-1;
      return new_v;
    };

    body.move = function(){
      if(body.topbottom_colliding()) body.speed.x *= -1;
      if(body.rightleft_colliding()) body.speed.y *= -1;


      //collision detection for planets
      for(var p in game.planets){
        if(body.is_planet_colliding(game.planets[p])){
          var normal_vector = body.directional_vector(game.planets[p]);
          var reflecting_vector = body.orthogonal_vector(normal_vector);
          body.speed = body.speed.reflect_over(reflecting_vector);
          body.speed = body.speed.scalar_multiply( 0.996); // rub rub

          // handle clipping. reposition agent 
          // so it's no longer overlapping with
          // this planet
          var clipping = body.clipping_distance(game.planets[p]);
          var direction_to_correct = body.directional_vector(game.planets[p]);
          var correction = direction_to_correct.get_unit_vector();
          correction = correction.scalar_multiply( -clipping);


          body.update_position(correction);

        }
      }


      for(var p in game.planets){
        var d = body.directional_vector(game.planets[p]);
        d = d.get_unit_vector();
        d = d.scalar_multiply(10);
        var decay = body.gravitational_decay(game.planets[p]);
        d = d.scalar_multiply(decay);
        body.speed = body.speed.apply_vector(d);
      }

      var out = "speed";
      out = out + "\n<br>";
      out = out + body.speed.x;
      out = out + "\n<br>";
      out = out + body.speed.y;
      out = out + "\n<br>";
      out = out + body.speed.get_magnitude();
      out = out + "\n<br>";
      out = out + "tracers ";
      out = out + body.traces.length;
      out = out + "\n<br>";
      out = out + "pos: ";
      out = out + "\n<br>";
      out = out + body.x;
      out = out + "\n<br>";
      out = out + body.y;
      out = out + "\n<br>";
      out = out + "pull: " + d.get_magnitude();
      out = out + "\n<br>";
      out = out + "decay: " + body.gravitational_decay(game.planets[p]);
      document.getElementById("log").innerHTML = out;

      body.update_history();
      body.update_position(body.speed);
      body.takeUserInput();
    };

    body.takeUserInput = function(){
      var v = function(a,b){ return {x:a,y:b};};
      var A = 65;
      var W = 87;
      var S = 83;
      var D = 68;

      var power = 0.07;

      var up = v(0,-power);
      var down = v(0,power);
      var left = v(-power,0);
      var right = v(power,0);

      switch(document.lastKeyDown){

        case A:
          body.speed = body.speed.apply_vector(left);
          break;

        case W:
          body.speed = body.speed.apply_vector(up);
          break;

        case S:
          body.speed = body.speed.apply_vector(down);
          break;

        case D:
          body.speed = body.speed.apply_vector(right);
          break;

      }
    };

    body.heat_of = function(){

      // range is #00ff00 to #ffff00 to #ff0000

      //range is defined by two ranges
      // ff00 = 65280 is 7
      // ffff = 65535 is 4
      // 00ff = 255   is 0

      var b = "00";
      var intensity = body.speed.get_magnitude();
      if(intensity > 4){
        return "#ff00" + b;
      }
      if(intensity <= 4){
        return "#00ff" + b;
      }
    };
    body.update_history = function(){
      var max = 1000;
      var trash = 500;
      if(body.traces.length > max){
        body.traces = body.traces.slice(max-trash);
      }
      //body.traces.push(new Trace(body.x, body.y, body.heat_of()));
    };


    body.draw = function(){
      context.beginPath();
      context.fillStyle = body.color;
      body.canvas_x = body.x + game.camera_x;
      body.canvas_y = body.y + game.camera_y;
      context.arc(body.canvas_x, body.canvas_y, body.r, 0, Math.PI*2, true);
      context.closePath();
      context.fill();
      for(var i in body.traces){
        body.traces[i].draw();
      }
    };	

  }

  function Game(){
    var game = this;

    game.rand_color = function(){
      var color = "#";
      var i;
      for(i=0;i<3;i++){
        color += (Math.floor(Math.random()*210) + 20).toString(16);
      }
      return color;
    }

    game.generate_star_clusters = function(){

      var gauss = function(mean, variance) {
        if (mean == undefined)
          mean = 0.0;
        if (variance == undefined)
          variance = 1.0;
        var V1, V2, S, X;
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
          stars.push(new Body(sx,sy,1,0,0,"#ffffff",0,game));
        }
      }
      return stars;
    }


    game.camera_x = 0;
    game.camera_y = 0;
    game.zoom = 1;
    game.planets = [];
    game.planets.push(new Body(250, 200, 20, 2, 7, game.rand_color(), 10, game));
    // simple float around
    game.bro = new Body(90, 66, 20, -1.5, 2, game.rand_color(), 0, game);

    // demonstrate collision detection, head-on
    //bro = new Body(250, 150, 20, 0, 0, game.rand_color(), 0,game);

    // demonstrate collision detection, head on,
    // slightly to side. demonstrate normal vector
    // for collision calculation.
    //bro = new Body(260, 160, 20, 0, 2, game.rand_color(), 0,game);

    game.stars = game.generate_star_clusters();

    //setup controls
    document.lastKeyDown = null;
    document.onkeydown = function(e){
      document.lastKeyDown = e.keyCode;
    };

    document.onkeyup = function(e){
      document.lastKeyDown = null;
    };

    game.camera_update = function(){
      // get focal point 
      var middle_point = {x: 0, y: 0};
      middle_point.x = canvas.width/2;
      middle_point.y = canvas.height/2;
      var directional_vector = {};
      directional_vector.x = game.bro.canvas_x - middle_point.x
      directional_vector.y = game.bro.canvas_y - middle_point.y

      var camera_friction = 0.05;
      directional_vector.x = directional_vector.x * camera_friction;
      directional_vector.y = directional_vector.y * camera_friction;

      game.camera_x -= directional_vector.x;
      game.camera_y -= directional_vector.y;

    };

    game.game_tick = function(){
      context.clearRect(0, 0, canvas.width, canvas.height);
      for(var i=0;i<game.stars.length;i++){
        game.stars[i].draw();
      }
      for(var i in game.planets){
        game.planets[i].draw();
      }
      game.bro.move();
      game.bro.draw();
      game.camera_update();
    }

  }

  window.init = function(){
    canvas = document.getElementById('SpaceCanvas');
    context = canvas.getContext('2d');
    var game = new Game();
    setInterval(game.game_tick, frame_tick);
  }


})(window,document)
