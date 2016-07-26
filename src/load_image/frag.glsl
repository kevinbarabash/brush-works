precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

mat3 rgb2xyz = mat3(
    0.4124, 0.2126, 0.0193,     // col 1
    0.3576, 0.7152, 0.1192,     // col 2
    0.1805, 0.0722, 0.9505      // col 3
);

void main() {
    vec4 color = texture2D(uSampler, vec2(vUV.s, vUV.t));
    gl_FragColor = vec4(rgb2xyz * color.rgb, color.a);
}
