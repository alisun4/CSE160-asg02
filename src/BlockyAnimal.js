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

// Set up actions for the HTML UI elements
function addActionsforHTMLUI() {

    // Clear
    document.getElementById('clear').onclick = function() { g_shapesList = []; renderAllShapes() };

    // Shapes
    document.getElementById('point').onclick = function() { g_selectedType = POINT };
    document.getElementById('triangle').onclick = function() { g_selectedType = TRIANGLE };
    document.getElementById('circle').onclick = function() { g_selectedType = CIRCLE };

    // Color slider events
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

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

    // renderAllShapes();
    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000;
var g_seconds = performance.now()/1000 - g_globalAngle-g_startTime;

function tick() {
    g_seconds = performance.now()/1000 - g_globalAngle-g_startTime;
    console.log(g_seconds);
    renderAllShapes();
    requestAnimationFrame(tick);
}

function renderAllShapes() {
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw a test triangle
    // drawTriangle3D( [1.0, 0.0, 0.0, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0] );

    // Body cube
    var body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    body.matrix.translate(-0.25, -0.75, 0.0);
    body.matrix.rotate(-5, 1, 0, 0);
    body.matrix.scale(0.5, 0.3, 0.5);
    body.render();

    var leftArm = new Cube();
    leftArm.color = [1, 1, 0, 1];
    leftArm.matrix.setTranslate(0, -0.5, 0.0);
    leftArm.matrix.rotate(-5, 1, 0, 0);
    leftArm.matrix.rotate(g_yellowAngle, 0, 0, 1);
    var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
    leftArm.matrix.scale(0.25, 0.7, 0.5);
    leftArm.matrix.translate(-0.5, 0, 0);
    leftArm.render();

    // Test cube
    var box = new Cube();
    box.color = [1,0,1,1];
    box.matrix = yellowCoordinatesMat;
    box.matrix.translate(0, 0.65, 0);
    box.matrix.rotate(g_magentaAngle,0,0,1);
    box.matrix.scale(0.3, 0.3, 0.3);
    box.matrix.translate(-0.5, 0, 0);
    box.render();
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