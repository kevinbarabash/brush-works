precision highp  float;

uniform vec3 uColor;
uniform float uRadius;

mat3 rgb2xyz = mat3(
    0.4124, 0.2126, 0.0193,     // col 1
    0.3576, 0.7152, 0.1192,     // col 2
    0.1805, 0.0722, 0.9505      // col 3
);

void main() {
    // TODO: add uniforms to control brush fuzziness
    float a = 1. - clamp(length(2. * (gl_PointCoord - vec2(0.5))), 0., 1.);
    float pxSize = 1. / uRadius;

//    gl_FragColor = vec4(rgb2xyz * uColor, smoothstep(0., pxSize, a));
    gl_FragColor = vec4(rgb2xyz * uColor, 0.25 * a);
}
