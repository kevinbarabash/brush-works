precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

mat3 xyz2rgb = mat3(
    3.2406, -0.9689, 0.0557,    // col 1
    -1.5372, 1.8758, -0.2040,   // col 2
    -0.4986, 0.0415, 1.0570     // col 3
);

void main() {
    vec4 color = texture2D(uSampler, vec2(vUV.s, vUV.t));
    gl_FragColor = vec4(xyz2rgb * color.rgb, color.a);
}
