"use strict";

let canvas = document.getElementById('drawingCanvas');
let gl = canvas.getContext('webgl2');

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

let aPosition = gl.getAttribLocation(program, 'aPosition');
let uColor = gl.getUniformLocation(program, 'uColor');
let uTranslation = gl.getUniformLocation(program, 'uTranslation');
let uRotation = gl.getUniformLocation(program, 'uRotation');
let uScale = gl.getUniformLocation(program, 'uScale');

let translation = [0.0, 0.0];
let rotation = 0.0;
let scale = 1.0;
let currentColor = [0.0, 1.0, 0.0, 1.0];
let drawMode = false;
let isDrawing = false;
let vertices = [];
let fill = false;

canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

canvas.addEventListener('mousedown', (event) => {
    if (drawMode) {
        isDrawing = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (drawMode && isDrawing) {
        canvas.style.cursor = 'crosshair';
        let rect = canvas.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / canvas.width) * 2 - 1;
        let y = ((e.clientY - rect.top) / canvas.height) * -2 + 1;


        vertices.push(x, y);
        drawShape(fill);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
    isDrawing = false;
});

document.getElementById('drawButton').addEventListener('click', () => {
    canvas.style.cursor = 'crosshair';
    translation = [0.0, 0.0];
    fill = false;
    drawMode = true;
    vertices = [];
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    let color = event.target.value;
    currentColor = hexToRgb(color);
});

document.getElementById('moveRightButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    translation[0] += 0.1;
    gl.uniform2fv(uTranslation, translation);

    drawShape(fill);
});
document.getElementById('moveLeftButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    translation[0] -= 0.1;
    gl.uniform2fv(uTranslation, translation);
    drawShape(fill);
});
document.getElementById('moveUpButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    translation[1] += 0.1;
    gl.uniform2fv(uTranslation, translation);
    drawShape(fill);
});
document.getElementById('moveDownButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    translation[1] -= 0.1;
    gl.uniform2fv(uTranslation, translation);
    drawShape(fill);
});

document.getElementById('rotateClockwiseButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    rotation += 0.1;
    drawShape(fill);
});
document.getElementById('rotateCounterClockwiseButton').addEventListener('click', () => {
    drawMode = false;
    canvas.style.cursor = 'default';
    rotation -= 0.1;
    drawShape(fill);
});

document.getElementById('scaleRange').addEventListener('input', (event) => {
    drawMode = false;
    canvas.style.cursor = 'default';
    scale = parseFloat(event.target.value);
    drawShape(fill);
});

document.getElementById('clearButton').addEventListener('click', () => {
    canvas.style.cursor = 'default';
    translation = [0.0, 0.0];
    rotation = 0.0;
    scale = 1.0;
    drawMode = false;
    vertices = [];
    fill = false;
    gl.clear(gl.COLOR_BUFFER_BIT);
});

document.getElementById('fillButton').addEventListener('click', () => {
    canvas.style.cursor = 'default';
    drawMode = false;
    if (vertices.length > 0) {
        fill = true;
        drawShape(fill);
    }
});


function drawShape(fill = false) {
    if (vertices.length === 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
    }

    let positionBuffer = createBuffer(gl, new Float32Array(vertices));
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.uniform4fv(uColor, currentColor);
    gl.uniform2fv(uTranslation, translation);
    gl.uniform1f(uRotation, rotation);
    gl.uniform1f(uScale, scale);

    if (fill) {
        const triangleIndices = earClipping(vertices);
        const indicesBuffer = createElementBuffer(gl, new Uint16Array(triangleIndices));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.drawElements(gl.TRIANGLES, triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 2);
    }
}

function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    let r = ((bigint >> 16) & 255) / 255;
    let g = ((bigint >> 8) & 255) / 255;
    let b = (bigint & 255) / 255;
    return [r, g, b, 1.0];
}
function earClipping(points) {
    const triangles = [];
    let vertices = [];
    for (let i = 0; i < points.length / 2; i++) {
        vertices.push(i);
    }

    while (vertices.length > 3) {
        for (let i = 0; i < vertices.length; i++) {
            const prev = vertices[(i + vertices.length - 1) % vertices.length];
            const curr = vertices[i];
            const next = vertices[(i + 1) % vertices.length];

            if (isEar(prev, curr, next, points)) {
                triangles.push(prev, curr, next);
                vertices.splice(i, 1);
                break;
            }
        }
    }
    triangles.push(vertices[0], vertices[1], vertices[2]);
    return triangles;
}

function isEar(v0, v1, v2, points) {
    const p0 = getPoint(points, v0);
    const p1 = getPoint(points, v1);
    const p2 = getPoint(points, v2);

    for (let i = 0; i < points.length / 2; i++) {
        const p = [points[i * 2], points[i * 2 + 1]];
        if (i !== v0 && i !== v1 && i !== v2) {
            if (isPointInTriangle(p, p0, p1, p2)) {
                return false;
            }
        }
    }
    return true;
}
function getPoint(points, index) {
    return [points[index * 2], points[index * 2 + 1]];
}

function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    let v0 = [cx - ax, cy - ay];
    let v1 = [bx - ax, by - ay];
    let v2 = [px - ax, py - ay];

    let dot00 = v0[0] * v0[0] + v0[1] * v0[1];
    let dot01 = v0[0] * v1[0] + v0[1] * v1[1];
    let dot02 = v0[0] * v2[0] + v0[1] * v2[1];
    let dot11 = v1[0] * v1[0] + v1[1] * v1[1];
    let dot12 = v1[0] * v2[0] + v1[1] * v2[1];

    let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v < 1;
}

