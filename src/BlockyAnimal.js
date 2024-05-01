// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;  // uniform変数
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_globalX = 0;
let g_globalY = 0;
let g_globalZ = 0;
let g_origin = [0, 0];

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_headAngle = 0;
let g_leftAngle = 0;
let g_rightAngle = 0;
let g_magentaAngle = 0;
let g_headAnimation = false;
let g_magentaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsforHTMLUI() {

    // Animation On/Off
    document.getElementById('rotateHeadOffButton').onclick = function() { g_headAnimation = false; };
    document.getElementById('rotateHeadOnButton').onclick = function() { g_headAnimation = true; };

    document.getElementById('animationMagentaOffButton').onclick = function() { g_magentaAnimation = false; };
    document.getElementById('animationMagentaOnButton').onclick = function() { g_magentaAnimation = true; };

    // Size slider
    document.getElementById('rotateHead').addEventListener('mousemove', function () { g_headAngle = this.value; renderAllShapes() });
    document.getElementById('kickLeft').addEventListener('mousemove', function () { g_leftAngle = this.value; renderAllShapes() });
    document.getElementById('kickRight').addEventListener('mousemove', function () { g_rightAngle = this.value; renderAllShapes() });
    document.getElementById('rotateMagenta').addEventListener('mousemove', function () { g_magentaAngle = this.value; renderAllShapes() });
    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });
    
}

function main() {
    setupWebGL();
    
    connectVariablestoGLSL();

    addActionsforHTMLUI();

    // Register function (event handler) to be called on a mouse press
    // canvas.onmousedown = click;
    canvas.onmousedown = origin;

    canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);

}

var g_startTime = performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
    g_seconds=performance.now()/1000.0-g_startTime;
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

var g_shapesList = [];

function origin(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    g_origin = [x, y];
}

function click(ev) {
    let coordinates = convertCoordinatesEventToGL(ev);
    g_globalX = g_globalX - coordinates[0]*360; // used to be minus for both
    g_globalY = g_globalY - coordinates[1]*360;

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;

    let temp = [x,y];
    x = (x - g_origin[0])/400;
    y = (y - g_origin[1])/400;
    g_origin = temp;

    return([x,y]);
}

function updateAnimationAngles() {
    if (g_headAnimation) {
        g_headAngle = (45 * Math.sin(g_seconds));
    }

    if (g_magentaAnimation) {
        g_magentaAngle = (45 * Math.sin(3 * g_seconds));
      }

}

function renderAllShapes() {
    var startTime = performance.now();

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Colors
    var BROWN = [0.610, 0.603, 0.531, 1.0];
    var PINK = [0.830, 0.681, 0.681, 1.0];
    var WHITE = [1.0, 1.0, 1.0, 1.0];


    // Bunny head

    var head = new Cube();
    head.color = BROWN;
    head.matrix.scale(0.45, 0.4, 0.4);
    head.matrix.translate(-0.5, -0.1, -2.125);
    head.matrix.rotate(-g_headAngle, 0, 1, 0);
    head.matrix.rotate(45*Math.sin(g_headAngle), 0, 1, 0);
    head.render();

    // Eyes
    

    // Ears
    var ear1 = new Cube();
    ear1.color = BROWN;
    ear1.matrix.scale(0.11, 0.6, 0.1);
    ear1.matrix.translate(-1.5, 0.25, -5.75);
    ear1.matrix.rotate(-20, 1, 45, 0);
    ear1.render();

    var ear2 = new Cube();
    ear2.color = BROWN;
    ear2.matrix.scale(0.11, 0.6, 0.1);
    ear2.matrix.translate(0.5, 0.25, -5.75);
    ear2.matrix.rotate(20, 1, 45, 0);
    ear2.render();

    var nose = new Cube();
    nose.color = PINK;
    nose.matrix.scale(0.1, 0.1, 0.1);
    nose.matrix.translate(-0.5, 0.9, -9);
    nose.render();

    
    // Body

    var body = new Cube();
    body.color = BROWN;
    body.matrix.rotate(12, 1, 0, 0);
    body.matrix.scale(0.5, 0.4, 0.8);
    body.matrix.translate(-0.5, -1, -0.8);
    // body.matrix.setTranslate(0, -0.5, 0.0);
    // body.matrix.rotate(-5, 1, 0, 0);
    // body.matrix.rotate(-g_yellowAngle, 0, 0, 1);
    // body.matrix.rotate(45*Math.sin(g_seconds), 0, 0, 1);
    // var yellowCoordinatesMat = new Matrix4(body.matrix);
    // body.matrix.scale(0.25, 0.7, 0.5);
    // body.matrix.translate(-0.5, 0, 0);
    body.render();

    // Back haunches
    var haunchL = new Cube();
    haunchL.color = BROWN;
    haunchL.matrix.rotate(12, 1, 0, 0);
    haunchL.matrix.rotate(g_leftAngle, 1, 0, 0);
    haunchL.matrix.scale(0.15, 0.4, 0.3);
    haunchL.matrix.translate(-2, -1.4, -0.5);
    haunchL.render();

    var haunchR = new Cube();
    haunchR.color = BROWN;
    haunchR.matrix.rotate(12, 1, 0, 0);
    haunchR.matrix.rotate(g_rightAngle, 1, 0, 0);
    haunchR.matrix.scale(0.15, 0.4, 0.3);
    haunchR.matrix.translate(1, -1.4, -0.5);
    haunchR.render();

    // Legs
    var frontlegL = new Cube();
    frontlegL.color = BROWN;
    frontlegL.matrix.rotate(12, 1, 0, 0);
    frontlegL.matrix.scale(0.15, 0.5, 0.13);
    frontlegL.matrix.translate(-2, -1.5, -5); 
    frontlegL.render();

    var frontlegR = new Cube();
    frontlegR.color = BROWN;
    frontlegR.matrix.rotate(12, 1, 0, 0);
    frontlegR.matrix.scale(0.15, 0.5, 0.13);
    frontlegR.matrix.translate(1, -1.5, -5);
    frontlegR.render();


    var backlegL = new Cube();
    backlegL.color = BROWN;
    backlegL.matrix.translate(-0.3, -0.55, -0.48);
    backlegL.matrix.rotate(90, 1, 0, 0);
    backlegL.matrix.scale(0.15, 0.5, 0.075);
    backlegL.render();

    var backlegR = new Cube();
    backlegR.color = BROWN;
    backlegR.matrix.translate(0.15, -0.55, -0.48);
    backlegR.matrix.rotate(90, 1, 0, 0);
    backlegR.matrix.scale(0.15, 0.5, 0.075);
    backlegR.render();

    var tail = new Cube();
    tail.color = WHITE;
    tail.matrix.scale(0.2, 0.2, 0.2);
    tail.matrix.translate(-0.5, -1.6, 0);
    tail.matrix.rotate(12, 1, 0, 0);
    tail.render();
    
    // var notbody = new Cube();
    // notbody.color = [1.0, 0.0, 0.0, 1.0];
    // notbody.matrix.translate(-0.25, -0.75, 0.0);
    // notbody.matrix.rotate(-5, 1, 0, 0);
    // notbody.matrix.scale(0.5, 0.3, 0.5);
    // notbody.render();

    
    // Test cube
    // var magenta = new Cube();
    // magenta.color = [1,0,1,1];
    // magenta.matrix = yellowCoordinatesMat;
    // magenta.matrix.translate(0, 0.65, 0);
    // magenta.matrix.rotate(-g_magentaAngle,0,0,1);
    // magenta.matrix.scale(0.3, 0.3, 0.3);
    // magenta.matrix.translate(-0.5,0, -0.001);
    // magenta.render();

    var duration = performance.now() - startTime;
	sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {   // we take the text and its htmlID
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
      console.log("Failed to get " + htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text; // send inner html to whatver the text was
  }