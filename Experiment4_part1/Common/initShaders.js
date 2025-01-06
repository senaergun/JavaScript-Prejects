function initShaders(gl, vertexShaderId, fragmentShaderId) {
    var vertShdr, fragShdr;

    var vertElem = document.getElementById(vertexShaderId);
    if (!vertElem) {
        console.error("Unable to load vertex shader");
        return null;
    }

    var fragElem = document.getElementById(fragmentShaderId);
    if (!fragElem) {
        console.error("Unable to load fragment shader");
        return null;
    }

    // Vertex shader
    vertShdr = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShdr, vertElem.textContent);
    gl.compileShader(vertShdr);

    // Hata kontrolü
    if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
        console.error("Vertex shader failed to compile.");
        console.error(gl.getShaderInfoLog(vertShdr));
        return null;
    }

    // Fragment shader
    fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShdr, fragElem.textContent);
    gl.compileShader(fragShdr);

    // Hata kontrolü
    if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
        console.error("Fragment shader failed to compile.");
        console.error(gl.getShaderInfoLog(fragShdr));
        return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShdr);
    gl.attachShader(program, fragShdr);
    gl.linkProgram(program);

    // Programın bağlanması sırasında hata kontrolü
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader program failed to link.");
        console.error(gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}
