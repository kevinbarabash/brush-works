precision highp float;

attribute vec2 pos;
attribute vec2 uv;

uniform mat4 projMatrix;
uniform mat4 mvMatrix;

varying vec2 vUV;

void main() {
    gl_Position = projMatrix * mvMatrix * vec4(pos, 0., 1.);
    vUV = uv;
}
