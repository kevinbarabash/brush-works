import {createProgram, createBuffer, createTexture, textureFromImage} from './gl_helpers';
import {ortho, create, translate} from './math';
import {Brush} from './draw';


const width = 783;
const height = 801;

const canvas = document.createElement('canvas');
canvas.style = 'position:absolute;left:0;top:0;';
canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
window.gl = gl;
gl.getExtension("OES_texture_float");
gl.getExtension("OES_texture_float_linear");
console.log(gl.getParameter(gl.VERSION));

const layers = [];

const loadImageVert = require('./load_image/vert.glsl');
const loadImageFrag = require('./load_image/frag.glsl');
const loadImageShader = createProgram(gl, loadImageVert, loadImageFrag);

const bgImg = document.createElement('img');
bgImg.onload = function() {
    const layer0 = createTexture(gl, gl.TEXTURE_2D, gl.RGBA, width, height);
    const imageTexture = textureFromImage(gl, gl.TEXTURE_2D, gl.RGBA, gl.FLOAT, bgImg);

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, layer0.texture, 0);

    loadImageShader.buffers.pos = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 0, width, 0, width, height, 0, height]), gl.STATIC_DRAW);
    loadImageShader.buffers.uv = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
    loadImageShader.buffers.elements = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 3]), gl.STATIC_DRAW);

    loadImageShader.useProgram();

    gl.blendFunc(gl.ONE, gl.ZERO);

    projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive

    gl.viewport(0, 0, width, height);
    gl.uniformMatrix4fv(loadImageShader.uniforms.projMatrix, false, projMatrix);
    gl.uniformMatrix4fv(loadImageShader.uniforms.mvMatrix, false, mvMatrix);

    gl.activeTexture(gl.TEXTURE1);
    imageTexture.bind();
    gl.uniform1i(loadImageShader.uniforms.uSampler, 1);

    loadImageShader.buffers.pos.bind();
    loadImageShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

    loadImageShader.buffers.uv.bind();
    loadImageShader.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

    loadImageShader.buffers.elements.bind();
    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);

    // TODO(kevinb) create a shader that converts and image from RGB to XYZ
    layers.unshift(layer0);
    updateCanvas(0, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
bgImg.src = 'src/801.jpg';

const brushVert = require('./brush/vert.glsl');
const brushFrag = require('./brush/frag.glsl');
const brushShader = createProgram(gl, brushVert, brushFrag);

const brush = new Brush(gl, brushShader);

gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

brushShader.buffers.pos = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([200, 200]), gl.STATIC_DRAW);
brushShader.buffers.elements = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0]), gl.STATIC_DRAW);

// TODO(kevinb) create a Layer object which combines a texture and a framebuffer
// the current layer will be the framebuffer that we draw to... this will be
// similar to a canvas context
var layer1 = createTexture(gl, gl.TEXTURE_2D, gl.RGBA, width, height);
layers.push(layer1);

// create a fbo and attac the texture to it
var fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, layer1.texture, 0);


gl.clearColor(0., 0., 0., 0.);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, width, height);


brushShader.useProgram();

let projMatrix;
let mvMatrix;
let mvMatrix2;

projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
mvMatrix = create();
mvMatrix2 = create();

gl.viewport(0, 0, width, height);

gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);

brush.setColor([1., 0., 1.]);
brush.curve([100, 50], [400, 300], [800, 100]);

const copyVert = require('./copy/vert.glsl');
const copyFrag = require('./copy/frag.glsl');
const copyShader = createProgram(gl, copyVert, copyFrag);

copyShader.buffers.pos = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 0, width, 0, width, height, 0, height]), gl.STATIC_DRAW);
copyShader.buffers.uv = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
copyShader.buffers.elements = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 3]), gl.STATIC_DRAW);


gl.bindFramebuffer(gl.FRAMEBUFFER, null);

copyShader.useProgram();

gl.blendFunc(gl.ONE, gl.ZERO);

projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive

gl.viewport(0, 0, width, height);
gl.uniformMatrix4fv(copyShader.uniforms.projMatrix, false, projMatrix);
gl.uniformMatrix4fv(copyShader.uniforms.mvMatrix, false, mvMatrix);

gl.activeTexture(gl.TEXTURE1);
layer1.bind();
gl.uniform1i(copyShader.uniforms.uSampler, 1);

copyShader.buffers.pos.bind();
copyShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

copyShader.buffers.uv.bind();
copyShader.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

copyShader.buffers.elements.bind();
gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);



let color = [Math.random(), Math.random(), Math.random()];

let lastMousePoint = null;
let lastMouseMidpoint = null;
let lastBrushPoint = null;

const downs = Kefir.fromEvents(document, 'mousedown');
const moves = Kefir.fromEvents(document, 'mousemove');
const ups = Kefir.fromEvents(document, 'mouseup');

let tool = 'brush';

const keyState = {};
const keydowns = Kefir.fromEvents(document, 'keydown').filter((e) => {
    if (keyState[e.keyCode]) {
        return false;
    }
    keyState[e.keyCode] = true;
    return true;
});
const keyups = Kefir.fromEvents(document, 'keyup');

keydowns.onValue((e) => {
    console.log(e.keyCode);

    if (e.keyCode === 32) {
        tool = 'pan';
    }
});

keyups.onValue((e) => {
    keyState[e.keyCode] = false;

    tool = 'brush';
});

const updateCanvas = (x, y) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);

    copyShader.useProgram();

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // projMatrix = ortho([], x - radius, x + radius, y - radius, y + radius, 1, -1);    // near z is positive
    // gl.viewport(x - radius, y - radius, 2 * radius, 2 * radius);

    gl.uniformMatrix4fv(copyShader.uniforms.projMatrix, false, projMatrix);
    gl.uniformMatrix4fv(copyShader.uniforms.mvMatrix, false, mvMatrix);

    for (const layer of layers) {
        gl.activeTexture(gl.TEXTURE1);
        layer.bind();
        gl.uniform1i(copyShader.uniforms.uSampler, 1);

        copyShader.buffers.pos.bind();
        copyShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

        copyShader.buffers.uv.bind();
        copyShader.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

        copyShader.buffers.elements.bind();
        gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);
    }
};

downs.onValue((e) => {
    e.preventDefault();

    // TODO(kevinb) rename this as currentMousePoint
    const currentPoint = [e.pageX, height - e.pageY];

    if (tool === 'brush') {
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO: don't redraw the whole screen each time
        projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
        gl.viewport(0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, layer1.texture, 0);

        color = [Math.random(), Math.random(), Math.random()];

        lastBrushPoint = [e.pageX, height - e.pageY];

        brushShader.useProgram();

        gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
        gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);

        brush.setColor(color);
        brush.drawPoints(currentPoint);

        updateCanvas(e.pageX, height - e.pageY);
    }

    lastMousePoint = [e.pageX, height - e.pageY];
});

ups.onValue((e) => {
    if (tool === 'brush') {
        const currentPoint = [e.pageX, height - e.pageY];
        lastBrushPoint = brush.line(lastMousePoint, currentPoint);
        lastMouseMidpoint = null;
    }

    lastMousePoint = null;
});

// TODO: filter out points that are too close
const drags = downs.flatMap((event) => moves.takeUntilBy(ups));

drags.onValue((e) => {
    const currentPoint = [e.pageX, height - e.pageY];

    if (tool === 'pan') {
        gl.clear(gl.COLOR_BUFFER_BIT);

        const dx = currentPoint[0] - lastMousePoint[0];
        const dy = currentPoint[1] - lastMousePoint[1];

        translate(mvMatrix, mvMatrix, [dx, dy, 0]);
        translate(mvMatrix2, mvMatrix2, [-dx, -dy, 0]);

        updateCanvas(e.pageX, height - e.pageY);

    } else if (tool === 'brush') {

        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO: don't redraw the whole screen each time
        // projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
        // gl.viewport(0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, layer1.texture, 0);

        brushShader.useProgram();

        // gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
        // gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);

        const midPoint = [(lastMousePoint[0] + currentPoint[0])/2, (lastMousePoint[1] + currentPoint[1])/2];

        if (!lastMouseMidpoint) {
            lastBrushPoint = brush.line(lastMousePoint, midPoint);
        } else {
            lastBrushPoint = brush.curve(lastMouseMidpoint, lastMousePoint, midPoint, lastBrushPoint);
        }

        lastMouseMidpoint = midPoint;

        updateCanvas(e.pageX, height - e.pageY);
    }

    lastMousePoint = currentPoint;
});
