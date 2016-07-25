import {createProgram, createBuffer, createTexture} from './gl_helpers';
const {ortho, create, translate} = require('./math');

const width = window.innerWidth;
const height = window.innerHeight;

console.log("hello, world!");

const bgImg = document.createElement('img');
bgImg.src = `https://placekitten.com/${width}/${height}`;
bgImg.style = 'position:absolute;left:0;top:0';
document.body.appendChild(bgImg);

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

const brushVert = require('./brush/vert.glsl');
const brushFrag = require('./brush/frag.glsl');
const brushShader = createProgram(gl, brushVert, brushFrag);

gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

brushShader.buffers.pos = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([200, 200]), gl.STATIC_DRAW);
brushShader.buffers.elements = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0]), gl.STATIC_DRAW);

// create an empty texture
var tex = createTexture(gl, gl.TEXTURE_2D, gl.RGBA, width, height);

// create a fbo and attac the texture to it
var fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.texture, 0);


gl.clearColor(0., 0., 0., 0.);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, width, height);


brushShader.useProgram();

let projMatrix;
let mvMatrix;
let mvMatrix2;
// TODO: instead of radius use line width/thickness
let radius = 100;

projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
mvMatrix = create();
mvMatrix2 = create();

gl.viewport(0, 0, width, height);

gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);
gl.uniform3fv(brushShader.uniforms.uColor, [1., 0., 1.]);
gl.uniform1f(brushShader.uniforms.uRadius, radius);

brushShader.buffers.pos.bind();
brushShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

brushShader.buffers.elements.bind();
gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 0);

const distance = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.sqrt(dx * dx + dy * dy);
};

let spacing = 0.2 * radius;

const drawPoints = (points) => {
    brushShader.buffers.pos.update(new Float32Array(points));
    brushShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

    const len = points.length / 2;
    brushShader.buffers.elements.update(new Uint16Array([...range(len)]));
    gl.drawElements(gl.POINTS, len, gl.UNSIGNED_SHORT, 0);

    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
    }
};

const line = (start, end) => {
    const d = distance(end, start);

    const cos = (end[0] - start[0]) / d;
    const sin = (end[1] - start[1]) / d;

    let p = [...start];
    let t = 0;

    const points = [];

    while (t + spacing < d) {
        p[0] += spacing * cos;
        p[1] += spacing * sin;
        t += spacing;
        points.push(...p);
    }

    console.log(points);
    drawPoints(points);

    return p;
};

// Adapted from http://www.malczak.linuxpl.com/blog/quadratic-bezier-curve-length/
function bezier_len(p0, p1, p2) {
    const a = [];
    const b = [];

    a[0] = p0[0] - 2 * p1[0] + p2[0];
    a[1] = p0[1] - 2 * p1[1] + p2[1];
    b[0] = 2 * p1[0] - 2 * p0[0];
    b[1] = 2 * p1[1] - 2 * p0[1];

    const A = 4 * (a[0] * a[0] + a[1] * a[1]);
    const B = 4 * (a[0] * b[0] + a[1] * b[1]);
    const C = b[0] * b[0] + b[1] * b[1];

    const Sabc = 2 * Math.sqrt(A + B + C);
    const A_2 = Math.sqrt(A);
    const A_32 = 2 * A * A_2;
    const C_2 = 2 * Math.sqrt(C);
    const BA = B / A_2;

    return (
            A_32 * Sabc +
            A_2 * B * (Sabc - C_2) +
            (4 * C * A - B * B) * Math.log( (2 * A_2 + BA + Sabc) / (BA + C_2) )
        ) / (4*A_32);
}

const curve = (p1, cp, p2, lastPoint = p1) => {
    const len = bezier_len(p1, cp, p2);
    const dt = spacing / len;

    for (let t = 0; t <= 1.0; t += dt) {
        const s = 1 - t;
        const x = s * s * p1[0] + 2 * s * t * cp[0] + t * t * p2[0];
        const y = s * s * p1[1] + 2 * s * t * cp[1] + t * t * p2[1];

        const currentPoint = [x, y];
        const d = distance(lastPoint, currentPoint);
        if (d > spacing) {
            lastPoint = line(lastPoint, currentPoint);
        }
    }

    return lastPoint;
};


const range = function* (len) {
    let i = 0;
    while (i < len) {
        yield i++;
    }
};

curve([100, 50], [400, 300], [800, 100]);

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
tex.bind();
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
let lastPoint = null;

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

    copyShader.useProgram();

    gl.blendFunc(gl.ONE, gl.ZERO);

    // projMatrix = ortho([], x - radius, x + radius, y - radius, y + radius, 1, -1);    // near z is positive
    // gl.viewport(x - radius, y - radius, 2 * radius, 2 * radius);

    gl.uniformMatrix4fv(copyShader.uniforms.projMatrix, false, projMatrix);
    gl.uniformMatrix4fv(copyShader.uniforms.mvMatrix, false, mvMatrix);

    gl.activeTexture(gl.TEXTURE1);
    tex.bind();
    gl.uniform1i(copyShader.uniforms.uSampler, 1);

    copyShader.buffers.pos.bind();
    copyShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

    copyShader.buffers.uv.bind();
    copyShader.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

    copyShader.buffers.elements.bind();
    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);
};

downs.onValue((e) => {
    e.preventDefault();

    // TODO(kevinb) rename this as currentMousePoint
    const currentPoint = [e.pageX, height - e.pageY];

    if (tool === 'brush') {
        color = [Math.random(), Math.random(), Math.random()];

        // TODO(kevinb) relabel these as lastBrushPoint
        lastPoint = [e.pageX, height - e.pageY];

        brushShader.useProgram();

        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO: don't redraw the whole screen each time
        projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
        gl.viewport(0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.texture, 0);

        gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
        gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);
        gl.uniform3fv(brushShader.uniforms.uColor, color);

        drawPoints(currentPoint);

        updateCanvas(e.pageX, height - e.pageY);
    }

    lastMousePoint = [e.pageX, height - e.pageY];
});

ups.onValue((e) => {
    if (tool === 'brush') {
        const currentPoint = [e.pageX, height - e.pageY];
        lastPoint = line(lastMousePoint, currentPoint);
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
        brushShader.useProgram();

        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // TODO: don't redraw the whole screen each time
        // projMatrix = ortho([], 0, width, 0, height, 1, -1);    // near z is positive
        // gl.viewport(0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.texture, 0);

        gl.uniformMatrix4fv(brushShader.uniforms.projMatrix, false, projMatrix);
        gl.uniformMatrix4fv(brushShader.uniforms.mvMatrix, false, mvMatrix2);

        gl.uniform3fv(brushShader.uniforms.uColor, color);

        const midPoint = [(lastMousePoint[0] + currentPoint[0])/2, (lastMousePoint[1] + currentPoint[1])/2];

        if (!lastMouseMidpoint) {
            lastPoint = line(lastMousePoint, midPoint);
        } else {
            lastPoint = curve(lastMouseMidpoint, lastMousePoint, midPoint, lastPoint);
        }

        lastMouseMidpoint = midPoint;

        updateCanvas(e.pageX, height - e.pageY);
    }

    lastMousePoint = currentPoint;
});
