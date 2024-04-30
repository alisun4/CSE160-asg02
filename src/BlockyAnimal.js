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

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl', { preserveDrawingBuffer: true });

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);

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
const PICTURE = 3;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsforHTMLUI() {

    // Animation On/Off
    document.getElementById('animationYellowOffButton').onclick = function() { g_yellowAnimation = false; };
    document.getElementById('animationYellowOnButton').onclick = function() { g_yellowAnimation = true; };

    document.getElementById('animationMagentaOffButton').onclick = function() { g_magentaAnimation = false; };
    document.getElementById('animationMagentaOnButton').onclick = function() { g_magentaAnimation = true; };

    // Size slider
    document.getElementById('rotateYellow').addEventListener('mousemove', function () { g_yellowAngle = this.value; renderAllShapes() });
    document.getElementById('rotateMagenta').addEventListener('mousemove', function () { g_magentaAngle = this.value; renderAllShapes() });
    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });
    
}

function main() {
    setupWebGL();
    
    connectVariablestoGLSL();

    addActionsforHTMLUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;

    canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

}

var g_shapesList = [];

function click(ev) {
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedType == POINT) {
        point = new Point();
    }
    else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    }
    else {
        point = new Circle();
        point.segments = g_segment;
    }

    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x, y]);
}

function updateAnimationAngles() {
    if (g_yellowAnimation) {
        g_yellowAngle = (45 * Math.sin(g_seconds));
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
    var PINK = [0.830, 0.681, 0.681, 1.0];


    // Bunny head

    var head = new Cube();
    head.color = [1, 1, 0, 1];
    head.matrix.scale(0.45, 0.4, 0.4);
    head.matrix.translate(-0.5, -0.1, -2.125);
    // head.matrix.rotate(-g_yellowAngle, 1, 1, 0);
    head.render();

    // Ears
    var ear1 = new Cube();
    ear1.color = [1, 1, 0, 1];
    ear1.matrix.scale(0.11, 0.6, 0.1);
    ear1.matrix.translate(-1.5, 0.25, -5.75);
    ear1.matrix.rotate(-20, 1, 45, 0);
    ear1.render();

    var ear2 = new Cube();
    ear2.color = [1, 1, 0, 1];
    ear2.matrix.scale(0.11, 0.6, 0.1);
    ear2.matrix.translate(0.5, 0.25, -5.75);
    ear2.matrix.rotate(20, 1, 45, 0);
    ear2.render();

    var nose = new Cube();
    nose.color = PINK;
    nose.matrix.scale(0.1, 0.1, 0.1);
    nose.matrix.translate(-0.5, 1.5, -9);
    nose.render();

    
    // Body

    var body = new Cube();
    body.color = [1, 1, 0, 1];
    body.matrix.scale(0.5, 0.4, 0.8);
    body.matrix.translate(-0.5, -0.7, -0.8);
    body.matrix.rotate(12, 1, 0, 0);                    // why is it so pointy
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
    haunchL.matrix.scale(0.13, 0.27, 0.3);
    haunchL.matrix.translate(-2, -2.5, 0);
    // haunchL.matrix.rotate();
    haunchL.render();

    var haunchR = new Cube();

    // Legs
    var frontlegL = new Cube();
    frontlegL.color = PINK;
    frontlegL.matrix.scale(0.13, 0.5, 0.13);
    frontlegL.matrix.translate(-2, -1.4, -5); 
    frontlegL.matrix.rotate(10, 0, 1, 0);               // tilt legs forward?
    frontlegL.render();

    var frontlegR = new Cube();
    frontlegR.color = PINK;
    frontlegR.matrix.scale(0.13, 0.5, 0.13);
    frontlegR.matrix.translate(1, -1.4, -5); 
    frontlegR.matrix.rotate(10, 0, 1, 0);
    frontlegR.render();


    var backlegL = new Cube();

    var backlegR = new Cube();

    var tail = new Cube();
    

    
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