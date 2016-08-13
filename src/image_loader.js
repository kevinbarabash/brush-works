import {createProgram, createBuffer, createLayer, textureFromImage} from './gl_helpers';
import Globals from './globals';


const loadImageVert = require('./load_image/vert.glsl');
const loadImageFrag = require('./load_image/frag.glsl');


const loadImageShader = createProgram(gl, loadImageVert, loadImageFrag);
loadImageShader.buffers.pos = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 0, width, 0, width, height, 0, height]), gl.STATIC_DRAW);
loadImageShader.buffers.uv = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
loadImageShader.buffers.elements = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 3]), gl.STATIC_DRAW);


// TODO: split the process of loading an image from drawing an image to layer
const loadImage = (gl, url) => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');

        img.onload = () => {
            gl.blendFunc(gl.ONE, gl.ZERO);  // image loading blend function

            const layer = createLayer(gl, gl.RGBA, img.width, img.height);
            const imageTexture = textureFromImage(gl, gl.TEXTURE_2D, gl.RGBA, gl.FLOAT, img);

            layer.setDrawable();

            loadImageShader.useProgram();

            // all shaders should grab the current projection and model view matrices
            // before rendering
            gl.uniformMatrix4fv(loadImageShader.uniforms.projMatrix, false, Globals.projectionMatrix);
            gl.uniformMatrix4fv(loadImageShader.uniforms.mvMatrix, false, Globals.modelViewMatrix);

            gl.activeTexture(gl.TEXTURE1);
            imageTexture.bind();
            gl.uniform1i(loadImageShader.uniforms.uSampler, 1);

            loadImageShader.buffers.pos.bind();
            loadImageShader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

            loadImageShader.buffers.uv.bind();
            loadImageShader.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

            loadImageShader.buffers.elements.bind();
            gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);

            // layers.unshift(layer0);
            // updateCanvas(0, 0);

            // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            resolve();
        };

        img.onerror = reject;

        img.src = url;
    });
};


module.exports = {
    loadImage
};
