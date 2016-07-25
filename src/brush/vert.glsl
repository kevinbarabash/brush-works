precision highp float;

attribute vec2 pos;

uniform mat4 projMatrix;
uniform mat4 mvMatrix;
uniform float uRadius;

void main() {
    gl_Position = projMatrix * mvMatrix * vec4(pos, 0., 1.);
    gl_PointSize = 2. * uRadius;
}
