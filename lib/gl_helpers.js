const load = function(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    return xhr.responseText;
};

const createShader = function(code, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`error compiling shader: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
};

const createAttrib = function(program, name) {
    const loc = gl.getAttribLocation(program, name);

    return {
        pointer(size, type, normalized, stride, offset) {
            gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
            gl.enableVertexAttribArray(loc);
        }
    }
};

const createProgram = function(path) {
    const vertCode = load(`${path}/vert.glsl`);
    const fragCode = load(`${path}/frag.glsl`);

    const vertShader = createShader(vertCode, gl.VERTEX_SHADER);
    const fragShader = createShader(fragCode, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);

    const uniformRegex1 = /uniform\s+[^\s]+\s+([_a-zA-Z][_a-zA-Z0-9]*)/g;
    const uniformRegex2 = /uniform\s+[^\s]+\s+([_a-zA-Z][_a-zA-Z0-9]*)/g;
    const attributeRegex = /attribute\s+[^\s]+\s+([_a-zA-Z][_a-zA-Z0-9]*)/g;

    const shader = {
        uniforms: {},
        attributes: {},
        buffers: {},
    };

    var matches;

    matches = attributeRegex.exec(vertCode);
    while (matches != null) {
        const attrib = matches[1];
        shader.attributes[attrib] = createAttrib(program, attrib);
        matches = attributeRegex.exec(vertCode);
    }

    matches = uniformRegex1.exec(vertCode);
    while (matches != null) {
        const uniform = matches[1];
        shader.uniforms[uniform] = gl.getUniformLocation(program, uniform);
        matches = uniformRegex1.exec(vertCode);
    }

    matches = uniformRegex2.exec(fragCode);
    while(matches != null) {
        const uniform = matches[1];
        shader.uniforms[uniform] = gl.getUniformLocation(program, uniform);
        matches = uniformRegex2.exec(fragCode);
    }

    shader.useProgram = function() {
        gl.useProgram(program);
        for (var key in shader.attributes) {
            gl.enableVertexAttribArray(shader.attributes[key]);
        }
    };

    return shader;
};

const createBuffer = function(target, data, usage) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);

    return {
        bind() {
            gl.bindBuffer(target, buffer);
        },

        update(data) {
            gl.bindBuffer(target, buffer);
            gl.bufferData(target, data, usage);
        }
    };
};

// TODO: use the babylon parser to grab type info
const createTexture = function(target, format, width, height, options = {}) {
    const border = 0;
    const internalFormat = format;
    const level = 0;
    const type = gl.FLOAT; // TODO: try out the floating point extension
    const pixels = options.pixels || null;  // ArrayBufferView

    var texture = gl.createTexture();

    gl.bindTexture(target, texture);

    const minFilter = options.minFilter || gl.LINEAR;
    const magFilter = options.magFilter || gl.LINEAR;

    gl.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // unbind
    gl.bindTexture(target, null);

    return {
        bind() {
            gl.bindTexture(target, texture);
        },
        texture: texture
    };
};

// image could be an Image, Canvas, or Video element
const textureFromImage = function(target, format, type, image, options) {
    options = options || {};
    const texture = gl.createTexture();

    const minFilter = options.minFilter || gl.LINEAR;
    const magFilter = options.magFilter || gl.LINEAR;

    const level = 0;
    const internalFormat = format;

    gl.bindTexture(target, texture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // unbind
    gl.bindTexture(target, null);

    return {
        bind() {
            gl.bindTexture(target, texture);
        },
        texture: texture
    };
};
