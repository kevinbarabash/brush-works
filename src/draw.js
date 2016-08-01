// TODO(kevinb) create a Brush object
// different brushes can have different settings
// -
class Brush {
    constructor(gl, shader) {
        this.radius = 100;
        this.color = [1., 0., 1.];
        this.spacing = 0.2 * this.radius;

        this.gl = gl;
        this.shader = shader;

        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(shader.program);
        gl.uniform1f(shader.uniforms.uRadius, this.radius);
        gl.uniform3fv(shader.uniforms.uColor, this.color);
        gl.useProgram(program);
    }

    drawPoints(points) {
        const {gl, shader} = this;

        shader.buffers.pos.update(new Float32Array(points));
        shader.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

        const len = points.length / 2;
        shader.buffers.elements.update(new Uint16Array([...range(len)]));

        gl.drawElements(gl.POINTS, len, gl.UNSIGNED_SHORT, 0);
    }

    line(start, end) {
        const {spacing} = this;
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

        // console.log(points);
        this.drawPoints(points);

        return p;
    }

    curve(p1, cp, p2, lastPoint = p1) {
        const {spacing} = this;
        const len = bezier_len(p1, cp, p2);
        const dt = spacing / len;

        for (let t = 0; t <= 1.0; t += dt) {
            const s = 1 - t;
            const x = s * s * p1[0] + 2 * s * t * cp[0] + t * t * p2[0];
            const y = s * s * p1[1] + 2 * s * t * cp[1] + t * t * p2[1];

            const currentPoint = [x, y];
            const d = distance(lastPoint, currentPoint);
            if (d > spacing) {
                lastPoint = this.line(lastPoint, currentPoint);
            }
        }

        return lastPoint;
    }

    setColor(color) {
        this.color = color;

        const {gl, shader} = this;
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(shader.program);
        gl.uniform3fv(shader.uniforms.uColor, color);
        gl.useProgram(program);
    }

    // TODO: instead of radius use line width/thickness
    setRadius(radius) {
        this.radius = radius;

        const {gl, shader} = this;
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(shader.program);
        gl.uniform1f(shader.uniforms.uRadius, radius);
        gl.useProgram(program);
    }

    // TODO: add a way to specify the clipping bounds
}

const distance = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.sqrt(dx * dx + dy * dy);
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


const range = function* (len) {
    let i = 0;
    while (i < len) {
        yield i++;
    }
};

module.exports = {
    Brush: Brush,
};
