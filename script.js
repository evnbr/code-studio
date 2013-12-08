
  // Constants
  // ----

  var fric_constant = 0.97;
  var spring_constant = 0.02;
  var targ_spring_constant = 0.0001;
  var stretch_constant = 0.1;
  var FPS = 60;
  var inset = {x: 0, y: 0};
  var doc = document;
  var wind = {w: window.innerWidth, h: window.innerHeight};
  var bumper = 30;
  var mouse = {x:0, y:0};
  var pmouse = {x:0, y:0};
  var tick = 1000 / FPS;
  var this_is_an_iphone = isiPhone();
  var thing = [];


  var arrangeMsg = [
    {x: 0, y: 0}, // h
    {x: 1, y: 0}, // a
    {x: 2, y: 0}, // p
    {x: 3, y: 0}, // p
    {x: 4, y: 0}, // y

    {x: 0, y: 1}, // b
    {x: 1, y: 1}, // i
    {x: 2, y: 1}, // r
    {x: 3, y: 1}, // t
    {x: 4, y: 1}, // h
    {x: 5, y: 1}, // d
    {x: 6, y: 1}, // a
    {x: 7, y: 1}, // y

    {x: 0, y: 2}, // d
    {x: 1, y: 2}, // a
    {x: 2, y: 2}, // i
    {x: 3, y: 2}, // s
    {x: 4, y: 2}, // y
  ];

  var letter_count = arrangeMsg.length;


  $(function(){
    if (this_is_an_iphone) x = 1; //$("body").on("touchmove", finger);
    else                   doc.body.addEventListener("mousemove", cursor, false);
    
    // Instantiate each letter
    // -----------------------
    for (var i = letter_count; i > 0; i--) {
      thing[i-1] = new Physical("box" + i);
      var x = wind.w/9 + arrangeMsg[i-1].x * 77 ;
      var y = wind.w/6 + arrangeMsg[i-1].y * 77;
      thing[i-1].move({x: x, y: y});
      thing[i-1].vel = {
        x: 0,// (Math.random() * 0.5 - 0.25),
        y: 0 //(Math.random() * 0.5 - 0.25)
      };

    }

    resize();
    window.onresize = resize;
    document.body.className = "letters-ready";

    // Animation step
    // -------------
    setTimeout(function(){
      (function step(){
        requestAnimationFrame(step);
        for (var i = letter_count; i > 0; i--) { thing[i-1].coast(); }
        // separate math and DOM steps
        for (var i = letter_count; i > 0; i--) { thing[i-1].applyMove(); }
      })();
    }, 300);

  });




  function set_position(pos) {

    // Give each thing a random start velocity
    // -------
    for (var i = letter_count; i > 0; i--) {
      thing[i-1].vel = {
        x: 0, //(Math.random() * 0.2 - 0.1),
        y: 0 //(Math.random() * 0.2 - 0.1)
      };
    }

    // Set each things new target position, then begin coasting
    // --------
    if (pos == "message") {
      var horiz_centerer = 0; //(wind.w / 2) - 3 * arrange17spacer;
      var vert_centerer = 0; //(wind.h / 2) - 1.5 * arrange17spacer;

      for (var i = letter_count; i > 0; i--) {
        var targx = arrangeMsg[i-1].x * arrange17spacer + horiz_centerer;
        var targy = arrangeMsg[i-1].y * arrange17spacer + vert_centerer;
        thing[i-1].targ = {x: targx, y: targy};
      }
      for (var i = letter_count; i > 0; i--) { thing[i-1].coast(); }
    }

  }





  function cursor(e) {
    pmouse = mouse;
    mouse = { x: e.clientX, y: e.clientY };
  }

  function finger(e) {
    // e.preventDefault();
    if (e.changedTouches) {
      pmouse = mouse;
      mouse = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY };
    }
  }







  var after;
  function resize() {
    wind = {w: window.innerWidth, h: window.innerHeight};

    if (wind.w < 500) {
      arrange17spacer = 20;
    }
    else {
      arrange17spacer = 60;
    }

    // Throttle event so reset doesn't hapen until the end of resizing
    // ------
    clearTimeout(after);
    after = setTimeout(reset_after_resize, 200);
  }
  function reset_after_resize() {
    set_position("message");
  }





  function Physical(selector) {
    var self = this;
    self.move = function(go) {
      self.pos = { x: go.x,
                y: go.y };
      //$("#log").html(build_tform(self.pos.x, self.pos.y, self.pos.vel));
      self.el.style.webkitTransform = build_tform(self.pos.x, self.pos.y, self.pos.vel);
      self.el.style.transform = build_tform(self.pos.x, self.pos.y, self.pos.vel);
      return self;
    };
    self.make_draggable = function(phys) {
      self.physics = phys;
      if (this_is_an_iphone) {
        doc.body.addEventListener('touchmove',self.drag,false);
        self.el.addEventListener('touchstart',self.start,false);
        doc.body.addEventListener('touchend',self.end,false);
      }
      else {
        self.el.addEventListener('mousedown',self.start,false);
        doc.body.addEventListener('mouseup',self.end,false);
        doc.body.addEventListener('mouseout',self.end,false);
        doc.body.addEventListener('mousemove',self.drag,false);
      }
    };
    self.start = function(e) {
      e.preventDefault();
      if (this_is_an_iphone) finger(e);

      // If animating right now, puase animation and move to correct spot
      self.move({x: self.$el.offset().left, y: self.$el.offset().top - $(window).scrollTop()});
      self.el.style.webkitAnimationName = "";
      self.vel = {x:0, y:0};

      // Begin drag
      self.off = {x: mouse.x - self.pos.x, y: mouse.y - self.pos.y};
      self.am_dragging = true;
      self.didnt_move = true;
    };
    self.drag = function(e) {
      if (this_is_an_iphone) finger(e);
      if (self.am_dragging) {
        self.didnt_move = false;
        self.currT = get_time();
        self.T =  self.currT - self.lastT;
        self.vel = {x: (mouse.x - pmouse.x)/self.T, y: (mouse.y - pmouse.y)/self.T};
        self.move({ x:mouse.x - self.off.x, y: mouse.y - self.off.y });
        self.lastT = self.currT;
      }
    };
    self.end = function() {
      if (self.am_dragging) {
        self.am_dragging = false;
      }
    };

    self.coast = function() {
        if (!self.am_dragging) {

          tiltsense(self);
          springwall(self);
          gravitate(self);


          // Apply friction
          self.vel.x *= fric_constant;
          self.vel.y *= fric_constant;

          // Update position based on size of 'tick'
          self.pos.x += self.vel.x * tick;
          self.pos.y += self.vel.y * tick;
        }

        // self.move({x: self.pos.x, y: self.pos.y});
    };

    self.applyMove = function() {
      self.move({x: self.pos.x, y: self.pos.y});
    }

    self.initiate = function() {
      self.selector = selector;                // Div id name
      self.$el = $("#" + selector);            // Jquery object
      self.el = doc.getElementById(selector);  // DOM Node
      self.inner = self.el.getElementsByClassName("inner")[0];
      self.size = {                            // Div size
        w: self.el.offsetWidth,
        h: self.el.offsetHeight
      };
      self.pos = {x:0, y:0};                   // Position
      self.vel = {x:0, y:0};                   // Velocity
      self.targ = {x:0, y:0};                  // Target 
      self.T = 0;                              // Time
      self.lastT = 0;                          // previous Time
      self.currT = 0;                          // current Time
      self.make_draggable(true);
    };
    self.initiate();
  }










  function gravitate(it) {
    for (var i = 0; i < thing.length; i++) {
      if (thing[i] !== it ) {
        var xdist = Math.abs(thing[i].pos.x - it.pos.x);
        var ydist = Math.abs(thing[i].pos.y - it.pos.y);
        var dist = Math.sqrt(xdist * xdist + ydist * ydist);
        var ypercent = (thing[i].pos.y - it.pos.y)/(xdist + ydist);
        var xpercent = (thing[i].pos.x - it.pos.x)/(xdist + ydist);
        var springiness = dist*dist * targ_spring_constant * 0.0001;
        var repulsion = -1/dist*dist * targ_spring_constant * 1000;

        // var bounceX = thing[i].vel.x + it.vel.x;
        // var bounceY = thing[i].vel.y + it.vel.y;

        //it.vel.x += xpercent * springiness;
        //it.vel.y += ypercent * springiness;

        if (dist < 80) {
          it.vel.x += xpercent * repulsion;
          it.vel.y += ypercent * repulsion;
          // it.vel.x += xpercent * bounceX * 0.2;
          // it.vel.y += ypercent * bounceY * 0.;
        }
      }
    }

  }


  var tilt = -3, roll = 0;
  window.addEventListener("deviceorientation", tilt_detect, true);

  function tilt_detect(event) {
    tilt = event.beta;
    roll = event.gamma;
  }

  function tiltsense(it) {
    it.vel.x += 0.001 * roll;
    it.vel.y += 0.001 * tilt;
  }






  function springwall(it) {
    var xspring, yspring;

    // X Position
    if      (it.pos.x < bumper)            xspring = bumper - it.pos.x;
    else if (it.pos.x > wind.w - bumper)   xspring = -bumper + (wind.w - it.pos.x);
    else                                   xspring = 0;

    // Y Position
    if      (it.pos.y < bumper)            yspring = bumper - it.pos.y;
    else if (it.pos.y > wind.h - bumper)   yspring = -bumper + (wind.h - it.pos.y);
    else                                   yspring = 0;

    // Update velocity
    it.vel.x += xspring * spring_constant;
    it.vel.y += yspring * spring_constant;
  }






  // Time utility functions
  // ----------------------
  function get_time() {
    if (window.performance) return performance.now();
    else return Date.now();
  }



  // Transformation Utility functions
  // --------------------------------

  function build_tform(x,y,vel) {
    vel = typeof vel !== 'undefined' ? vel : {x: 0, y: 0};
    var v = 1 + stretch_constant*(Math.sqrt(vel.x*vel.x + vel.y*vel.y));
    var a = Math.atan2(vel.x,vel.y);
      return "translate3d("+
        ~~(x * 1000)/1000 +"px,"+
        ~~(y * 1000)/1000 +"px,0) ";
  }


  // CSS Utility functions
  // ---------------------

  function isiPhone(){
    return (
        //Detect iPhone
        (navigator.platform.indexOf("iPhone") != -1) ||
        //Detect iPad
        (navigator.platform.indexOf("iPad") != -1) ||
        //Detect iPod
        (navigator.platform.indexOf("iPod") != -1)
    );
  }




