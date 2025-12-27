//---

console.clear();

//---

var paused = false;
var time = 0;

var invertActivated = false;
var pixelSize = 1;
var fov = 750;

//---

var canvasWidth = 480;
var canvasHeight = 480;

var border = { left: 1, top: 1, right: canvasWidth, bottom: canvasHeight };

//---

var canvas = document.createElement( 'canvas' );

canvas.width = canvasWidth; 
canvas.height = canvasHeight;

canvas.addEventListener( 'mousemove', mouseMoveHandler, false );
canvas.addEventListener( 'mousedown', mouseDownHandler, false );
canvas.addEventListener( 'mouseup', mouseUpHandler, false );

window.addEventListener( 'resize', onResize, false );

document.body.appendChild( canvas );

//---

var ctx = canvas.getContext( '2d' );
ctx.fillStyle = '#000000';
ctx.fillRect( 0, 0, canvasWidth, canvasHeight );
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
ctx.oImageSmoothingEnabled = false;

//---

var center = { x: canvasWidth / 2, y: canvasHeight / 2 };

var mousePos = { x: center.x, y: center.y };
var mouseDown = false;

//---

var imageData = ctx.createImageData( canvasWidth, canvasHeight );
var pix = imageData.data;

//---

var rotationSpeed = -1.00;
var rotationSpeedFactor = { x: 0, y: 0 };
rotationSpeedFactor.x = rotationSpeed / center.x;
rotationSpeedFactor.y = rotationSpeed / center.y;

//---

var animate = true;

var particleCount = 55000;
var texture = 'spot3430';

var moonRadius = 75;
var moonBumpRadius = 0;

var light;

var bumpScale = 50;
var bumpScalePercent = 0.77; 

//---

var colorInit = { R: 155, G: 155, B: 155, A: 255 };

//---

var model;

//---

var sourceImageCanvas;
var sourceImageContext;
var sourceImage;
var sourceImageData;
var sourcePix;

//---

function init() {

  initGUI();
  reInit();
  animloop();
  render();
  onResize();

};

function reInit() {

  getSourceImage();
  addParticles();

};

//---

var guiAPI;
var gui;

function initGUI() {

  guiAPI = {

    'Particles' : particleCount,
    'Texture' : texture.toString(),
    'Bump Scale' : 0.77,

    'FOV' : fov,
    'Invert Output' : invertActivated,
    'Pixel Size' : pixelSize,
    'Pause' : false

  };

  gui = new dat.GUI();

  var folder1 = gui.addFolder( 'Sphere Settings' );
  folder1.open();
  folder1.add( guiAPI, 'Particles', 5000, 555000 ).onChange( function() { particleCount = guiAPI[ 'Particles' ]; addParticles(); } );
  folder1.add( guiAPI, 'Texture', [ 'ako4384', 'dante', 'down3621', 'dust', 'earth', 'jupiter', 'mars', 'moon', 'reststop', 'rim', 'spot3430', 'venus' ] ).onChange( function() { initSourceImage( guiAPI[ 'Texture' ].toLowerCase() ); addParticles(); gui.close(); } );
  folder1.add( guiAPI, 'Bump Scale', 0.0, 1.0 ).onChange( function() { setBumpScale( guiAPI[ 'Bump Scale' ] ); addParticles(); } );

  var folder2 = gui.addFolder( 'Display Settings' );
  folder2.close();
  folder2.add( guiAPI, 'FOV', 500, 1000 ).onChange( function() { fov = guiAPI[ 'FOV' ]; } );
  folder2.add( guiAPI, 'Invert Output' ).onChange( function() { invertActivated = guiAPI[ 'Invert Output' ]; } );
  folder2.add( guiAPI, 'Pixel Size').min( 1 ).max( 4 ).step( 1 ).onChange( function() { pixelSize = parseInt( guiAPI[ 'Pixel Size' ] ); } );
  folder2.add( guiAPI, 'Pause' ).onChange( function() { paused = guiAPI[ 'Pause' ]; } );

  gui.close();

};

//---

var MATHPI180 = Math.PI / 180;

Math.radians = function( degrees ) {

  return degrees * Math.PI / 180;

};

function rangeToPercent( number, min, max ) {

  return ( ( number - min ) / ( max - min ) );

};

function percentToRange( percent, min, max ) {

  return ( ( max - min ) * percent + min );

};

//---

function setBumpScale( percent ) {

  bumpScale = percentToRange( 1 - percent, 10, 100 );
  bumpScalePercent = rangeToPercent( bumpScale, 10, 100 );

};

function getBumpedRadius() {

  var radius = 0;

  for ( var i = 0, l = model.modelInit.length; i < l; i++ ) {

    var particle = model.modelInit[ i ];

    var scale = fov / ( fov + particle.z );

    particle.x2d = ( ( particle.x * scale ) + center.x ) | 0; 
    particle.y2d = ( ( particle.y * scale ) + center.y ) | 0;

    var dx = center.x - particle.x2d;
    var dy = center.y - particle.y2d;

    var distance = Math.sqrt( dx * dx + dy * dy );

    if ( distance > radius ) {

      radius = distance;

    }

  }

  moonBumpRadius = Math.floor( radius ) - 2;

};

//---

function initSourceImage( name ) {

  var path = 'https://www.nkunited.de/ExternalImages/jsfiddle/planets/' + name + 'map.jpg';

  loadSourceImage( path );

};

function loadSourceImage( path ) {

  sourceImage = new Image();
  sourceImage.onload = function() {

    if ( !sourceImageCanvas ) {

      init();

    } else {

      reInit();

    }

  };
  
  sourceImage.crossOrigin = 'anonymous';
  sourceImage.src = path;

};

function getSourceImage() {

  sourceImageCanvas = document.createElement( 'canvas' );
  sourceImageCanvas.width = sourceImage.width; 
  sourceImageCanvas.height = sourceImage.height;

  sourceImageContext = sourceImageCanvas.getContext( '2d' );
  sourceImageContext.drawImage( sourceImage, 0, 0 );

  sourceImageData = sourceImageContext.getImageData( 0, 0, sourceImage.width, sourceImage.height );
  sourcePix = sourceImageData.data;

};

function getSourceImagePixel( x, y ) {

  var i = ( x + y * sourceImageData.width ) * 4;

  return { r:sourcePix[ i ],
           g:sourcePix[ i + 1 ],
           b:sourcePix[ i + 2 ],
           a:sourcePix[ i + 3 ] }

}

//---

function setPixel( x, y, r, g, b, a ) {

  var i = ( x + y * canvasWidth ) * 4;

  pix[ i ] = r;
  pix[ i + 1 ] = g;
  pix[ i + 2 ] = b;
  pix[ i + 3 ] = a;

};

function setPixelAdditive( x, y, r, g, b, a ) {

  var i = ( x + y * canvasWidth ) * 4;

  pix[ i ]     = pix[ i ] + r;
  pix[ i + 1 ] = pix[ i + 1 ] + g;
  pix[ i + 2 ] = pix[ i + 2 ] + b;
  pix[ i + 3 ] = a;

};

function clearImageData() {

  for ( var i = 0, l = pix.length; i < l; i += 4 ) {

    pix[ i ] = 0;
    pix[ i + 1 ] = 0;
    pix[ i + 2 ] = 0;
    pix[ i + 3 ] = 0;

  }

};

//---

function multiply( topValue, bottomValue ) {

  return topValue * bottomValue / 255;

};

//---

function drawMousePointer( x, y, w, h, r, g, b, a ) {

  var pL = { x: x - w / 2, y: y };
  var pR = { x: x + w / 2, y: y };
  var pT = { x: x, y: y - h / 2 };
  var pB = { x: x, y: y + h / 2 };

  drawLine( pL.x, pL.y, pR.x, pR.y, r, g, b, a );
  drawLine( pT.x, pT.y, pB.x, pB.y, r, g, b, a );

};

//---

function addParticle( x, y, z, r, g, b, a, type ) {

  var particle = {};
  particle.x = x;
  particle.y = y;
  particle.z = z;
  particle.ox = x;
  particle.oy = y;
  particle.oz = z;
  particle.vx = 0;
  particle.vy = 0;
  particle.vz = 0;
  particle.color = { r:r, g:g, b:b, a:a };
  particle.x2d = 0;
  particle.y2d = 0;
  particle.type = type;

  return particle;

};

function addParticles() {

  model = {};
  model.scaleFactor = 40;
  //model.particleHolder = [];
  model.rotation = { x:0, y:0, z:0 };
  model.position = { x:0, y:0, z:0 };
  model.draw = true;
  model.motion = true;
  model.modelInit = [];

  //---

  var x, y, z;

  var c = colorInit;
  var particle, particleCenter;
  var i, j, k;

  //---

  for ( i = 0; i < particleCount; i++ ) {

    var phi = Math.acos( -1 + ( 2 * i ) / particleCount );
    var theta = Math.sqrt( particleCount * Math.PI ) * phi;

    x = model.position.x + ( moonRadius * 2 ) * Math.cos( theta ) * Math.sin( phi );
    y = model.position.y + ( moonRadius * 2 ) * Math.sin( theta ) * Math.sin( phi );
    z = model.position.z + ( moonRadius * 2 ) * Math.cos( phi );

    var particleColorValue = Math.floor( Math.random() * 205 ) + 50;
    var particleColor = { r:particleColorValue, g:particleColorValue, b:particleColorValue, a:255 };

    particle = addParticle( x, y, z, particleColor.r, particleColor.g, particleColor.b, particleColor.a, 'MOON' );

    model.modelInit.push( particle );

    //---
    //get 2d texture coordinates and map them on the particles
    //http://stackoverflow.com/questions/19357290/convert-3d-point-on-sphere-to-uv-coordinate

    var p = { x:x, y:y, z:z };

    var dx = model.position.x - particle.x;
    var dy = model.position.y - particle.y;
    var dz = model.position.z - particle.z;

    var length = Math.sqrt( dx * dx + dy * dy + dz * dz );

    p.x = dx;
    p.y = dy;
    p.z = dz;

    p.x /= length;
    p.y /= length;
    p.z /= length;

    var u = Math.atan2( p.x, p.z ) / ( 2 * Math.PI ) + 0.5; 
    var v = Math.asin( p.y ) / Math.PI + 0.5;

    var nx = u * sourceImage.width;
    var ny = v * sourceImage.height;

    var c = getSourceImagePixel( nx | 0, ny | 0 );

    particle.color.r = c.r;
    particle.color.g = c.g;
    particle.color.b = c.b;

    //---
    //threshold color of each particle and reset particle position

    var threshold = ( particle.color.r + particle.color.g + particle.color.b ) / 3;

    var percent = threshold / 255;

    var distance = ( percent / bumpScale ) + 1;

    particle.x *= distance;
    particle.y *= distance;
    particle.z *= distance;

  }

  //---

  light = {};
  light.x = 150;
  light.y = -150;
  light.z = -150;
  light.brightness = 1.00;
  light.radius = 200;

  //---

  var lightParticleCount = 500;

  for ( i = 0; i < lightParticleCount; i++ ) {

    var phi = Math.acos( -1 + ( 2 * i ) / lightParticleCount );
    var theta = Math.sqrt( lightParticleCount * Math.PI ) * phi;

    x = 15 * Math.cos( theta ) * Math.sin( phi );
    y = 15 * Math.sin( theta ) * Math.sin( phi );
    z = 15 * Math.cos( phi );

    var particleColorValue = 255;//Math.floor( Math.random() * 205 ) + 50;
    var particleColor = { r:particleColorValue, g:particleColorValue, b:particleColorValue, a:255 };

    particle = addParticle( x, y, z, particleColor.r, particleColor.g, particleColor.b, particleColor.a, 'LIGHT' );

    model.modelInit.push( particle );

  }

  //---

  getBumpedRadius();

};

function drawLine( x1, y1, x2, y2, r, g, b, a ) {

  var dx = Math.abs( x2 - x1 );
  var dy = Math.abs( y2 - y1 );

  var sx = ( x1 < x2 ) ? 1 : -1;
  var sy = ( y1 < y2 ) ? 1 : -1;

  var err = dx - dy;

  var lx = x1;
  var ly = y1;    

  while ( true ) {

    if ( lx > 0 && lx < canvasWidth && ly > 0 && ly < canvasHeight ) {

      setPixel( lx, ly, r, g, b, a );

    }

    if ( ( lx === x2 ) && ( ly === y2 ) )
      break;

    var e2 = 2 * err;

    if ( e2 > -dx ) { 

      err -= dy; 
      lx += sx; 

    }

    if ( e2 < dy ) { 

      err += dx; 
      ly += sy; 

    }

  }

};

//---

window.requestAnimFrame = ( function() {

  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ) {
            window.setTimeout( callback, 1000 / 60 );
          };

} )();

function animloop() {

  requestAnimFrame( animloop );

  if ( !paused ) {

    render();

  }

};

function render() {

  clearImageData();

  //---

  var rx, rz;

  var fx = rotationSpeedFactor.x * mousePos.x - rotationSpeed;
  //var fx =  -0.1;
  var fy = rotationSpeed - rotationSpeedFactor.y * mousePos.y;

  var angleX = fx * MATHPI180;
  var angleY = fy * MATHPI180;

  var sx = Math.sin( angleX );
  var cx = Math.cos( angleX );
  var sy = Math.sin( angleY );
  var cy = Math.cos( angleY );

  //---

  var i, j, k, l, m, n;
  var r, g, b, a;
  var dx, dy, dz;
  var distance;

  var particle, particleCenter, particleFollow;
  var scale;

  //---
  //werte für automatische Drehung

  var ax = -0.15 * MATHPI180;
  var ay =  0.00 * MATHPI180;

  var sinx = Math.sin( ax );
  var cosx = Math.cos( ax );
  var siny = Math.sin( ay );
  var cosy = Math.cos( ay );

  //---
  //model
  
  for ( i = 0, l = model.modelInit.length; i < l; i++ ) {

    //pasticle
    var particle = model.modelInit[ i ];

    //3d rotation
    rx = particle.x;
    rz = particle.y * sy + particle.z * cy;

    particle.x = rx * cx + rz * sx;
    particle.y = particle.y * cy + particle.z * -sy;
    particle.z = rx * -sx + rz * cx;

    if ( particle.type === 'MOON' ) {

      //---
      //moon dreht sich von allein um seine Achse
      // var px = particle.x - model.position.x;
      // var py = particle.y - model.position.y;
      // var pz = particle.z - model.position.z;

      // rx = px;                       
      // rz = py * siny + pz * cosy;

      // var nx = rx * cosx + rz * sinx;
      // var ny = py * cosy + pz * -siny;
      // var nz = rx * -sinx + rz * cosx;

      // particle.x = nx + model.position.x;
      // particle.y = ny + model.position.y;
      // particle.z = nz + model.position.z;


    }

    //if ( particle.z > 0 && particle.type === 'MOON' ) {
    //if ( particle.z < 0 && particle.type === 'MOON' ) {
    if ( particle.z < -50 && particle.type === 'MOON' ) {

      //---
      //dir vector

      dx = model.position.x - particle.x;
      dy = model.position.y - particle.y;
      dz = model.position.z - particle.z;

      var length = Math.sqrt( dx * dx + dy * dy + dz * dz );

      particle.vx = dx;
      particle.vy = dy;
      particle.vz = dz;

      particle.vx /= length;
      particle.vy /= length;
      particle.vz /= length;

      particle.vx = -particle.vx;
      particle.vy = -particle.vy;
      particle.vz = -particle.vz;

      //---
      //light

      var dotProd = particle.vx * light.x + particle.vy * light.y + particle.vz * light.z;

      var normMag = Math.sqrt( particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz );

      var lightMag = Math.sqrt( light.x * light.x + light.y * light.y + light.z * light.z );

      var lightFactor = ( Math.acos( dotProd / ( normMag * lightMag ) ) / Math.PI ) * light.brightness;

      var colorValueR = particle.color.r - Math.floor( particle.color.r * ( lightFactor * 2 ) );
      var colorValueG = particle.color.g - Math.floor( particle.color.g * ( lightFactor * 2 ) );
      var colorValueB = particle.color.b - Math.floor( particle.color.b * ( lightFactor * 2 ) );

      //---
      //2d coordinates

      scale = fov / ( fov + particle.z );

      particle.x2d = ( ( particle.x * scale ) + center.x ) | 0; 
      particle.y2d = ( ( particle.y * scale ) + center.y ) | 0;

      if ( particle.x2d > border.left && particle.x2d < border.right && particle.y2d > border.top && particle.y2d < border.bottom && colorValueR > 0 ) {

        setPixel( particle.x2d, particle.y2d, colorValueR, colorValueG, colorValueB, 255 );

      }

    }

    if ( particle.type === 'LIGHT' ) {

      //light dreht sich von allein um seine Achse
      var px = particle.ox;
      var py = particle.oy;
      var pz = particle.oz;

      rx = px;                       
      rz = py * siny + pz * cosy;

      var nx = rx * cosx + rz * sinx;
      var ny = py * cosy + pz * -siny;
      var nz = rx * -sinx + rz * cosx;

      particle.x = nx + light.x;
      particle.y = ny + light.y;
      particle.z = nz + light.z;

      //---

      scale = fov / ( fov + particle.z );

      particle.x2d = ( ( particle.x * scale ) + center.x ) | 0; 
      particle.y2d = ( ( particle.y * scale ) + center.y ) | 0;

      if ( particle.x2d > border.left && particle.x2d < border.right && particle.y2d > border.top && particle.y2d < border.bottom ) {

        dx = center.x - particle.x2d;
        dy = center.y - particle.y2d;

        distance = Math.sqrt( dx * dx + dy * dy );

        if ( particle.z < 0 || particle.z >= 0 && distance > moonBumpRadius ) {
          
          setPixel( particle.x2d, particle.y2d, particle.color.r, particle.color.g, particle.color.b, particle.color.a );

        }

      }


    }

  }

  //---

  if ( invertActivated ) {

    for ( var j = 0, n = pix.length; j < n; j += 4 ) {

      pix[ j ]     = 255 - pix[ j ];     // red
      pix[ j + 1 ] = 255 - pix[ j + 1 ]; // green
      pix[ j + 2 ] = 255 - pix[ j + 2 ]; // blue
      pix[ j + 3 ] = 255;// - pix[ j + 3 ]; // alpha

    }

  }

  if ( pixelSize > 1 ) {

    for ( var x = 0, xl = canvasWidth; x < xl; x += pixelSize ) {

      for ( var y = 0, yl = canvasHeight; y < yl; y += pixelSize ) {

        var i = ( x + y * imageData.width ) * 4;

        var r = pix[ i ];
        var g = pix[ i + 1 ];
        var b = pix[ i + 2 ];

        for ( var xs = x, xsl = x + pixelSize; xs < xsl; xs++ ) {

          for ( var ys = y, ysl = y + pixelSize; ys < ysl; ys++ ) {

            setPixel( xs, ys, r, g, b, 255 );

          }

        }

      }

    }

  }

  //---
  //light position

  // light.x = Math.cos( time ) * light.radius + model.position.x;
  // light.z = Math.sin( time ) * light.radius + model.position.z;

  //light 3d rotation
  rx = light.x;
  rz = light.y * sy + light.z * cy;

  light.x = rx * cx + rz * sx;
  light.y = light.y * cy + light.z * -sy;
  light.z = rx * -sx + rz * cx;

  //light dreht sich von allein um seine Achse
  var px = light.x - model.position.x;
  var py = light.y - model.position.y;
  var pz = light.z - model.position.z;

  rx = px;                       
  rz = py * siny + pz * cosy;

  var nx = rx * cosx + rz * sinx;
  var ny = py * cosy + pz * -siny;
  var nz = rx * -sinx + rz * cosx;

  light.x = nx + model.position.x;
  light.y = ny + model.position.y;
  light.z = nz + model.position.z;

  //---
  //light position 2d

  scale = fov / ( fov + light.z );

  var lightX2d = ( ( light.x * scale ) + center.x ) | 0; 
  var lightY2d = ( ( light.y * scale ) + center.y ) | 0;

  dx = center.x - lightX2d;
  dy = center.y - lightY2d;

  distance = Math.sqrt( dx * dx + dy * dy );

  if ( particle.z > 0 && distance < moonBumpRadius ) {

    drawMousePointer( lightX2d, lightY2d | 0, 20, 20, 255, 0, 0, 255 );

  }

  //---

  ctx.putImageData( imageData, 0, 0 );

  //---

  time += 0.01;

};

//---

function mouseMoveHandler( event ) {

  mousePos = getMousePos( canvas, event );

};

function mouseDownHandler( event ) {

  mouseDown = true;

};

function mouseUpHandler( event ) {

  mouseDown = false;

};

function getMousePos( canvas, event ) {

  var rect = canvas.getBoundingClientRect();

  return { x: event.clientX - rect.left, y: event.clientY - rect.top };

};

//---

function onResize( event ) {

  canvasWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  //---

  border.right = canvasWidth;
  border.bottom = canvasHeight;
  
  center.x = canvasWidth / 2;
  center.y = canvasHeight / 2;

  //---
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  //---
  
  rotationSpeedFactor.x = rotationSpeed / center.x;
  rotationSpeedFactor.y = rotationSpeed / center.y;
  
  //---

  imageData = ctx.getImageData( 0, 0, canvasWidth, canvasHeight );
  pix = imageData.data;

  //---

  addParticles();

}

//---

initSourceImage( texture );