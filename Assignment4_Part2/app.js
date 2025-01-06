const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) {
    console.error("WebGL2 is not supported by your browser!");
}
const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

const monkeyScale = 0.6;
let cameraPosition = [0, 0, 30];
let cameraCenter = [0, 0, 0];
let cameraUp = [0, 1, 0];
let lastMousePos = { x: 0, y: 0 };
let rotZ = 30;
let horizontalAngle = 0;
let verticalAngle = 0;
let cameraRadius = 30;
let panOffsetX = 0;
let panOffsetY = 0;
let cameraRotationX = 0;
let cameraRotationY = 0;
let isDragging = false;

// Get Locations
const positionLoc = gl.getAttribLocation(program, 'a_position');
const modelLoc = gl.getUniformLocation(program, 'uModel');
const viewLoc = gl.getUniformLocation(program, 'uView');
const projectionLoc = gl.getUniformLocation(program, 'uProjection');
const scaleLoc = gl.getUniformLocation(program, 'uScale');

// Create Matrices
let modelMatrix = createIdentityMatrix();
let viewMatrix = lookAt(cameraPosition,cameraCenter,cameraUp);
let projectionMatrix = perspective(Math.PI / 20, canvas.width / canvas.height,0.1, 100 )


gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
gl.uniformMatrix4fv(projectionLoc, false, projectionMatrix);
gl.uniform1f(scaleLoc, monkeyScale);

const monkeyTransforms = [
    { position: [3, 0, 0], animation: animateZoom },
    { position: [0, 0, 0], animation: animateRotation },
    { position: [-3, 0, 0], animation: animateUpDown }
];

async function main() {
    // Load the monkey model
    const objText = await fetch("./monkey_head.obj").then(res => res.text());
    const modelCoordinates = loadObjModel(objText);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelCoordinates, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    function renderScene(time) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        viewMatrix = lookAt(cameraPosition, cameraCenter, cameraUp);
        gl.uniformMatrix4fv(viewLoc, false, viewMatrix);


        for (const transform of monkeyTransforms) {
            modelMatrix = createModelMatrix(transform.position);
            //viewMatrix = lookAt(cameraPosition, cameraCenter, cameraUp);
            transform.animation(modelMatrix, time);
            gl.uniformMatrix4fv(modelLoc, false, modelMatrix);
            //gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, modelCoordinates.length / 3);
        }

        requestAnimationFrame(renderScene);
    }

    renderScene(0);
}

function loadObjModel(objText) {
    const vertices=[];
    const faces=[];
    const coordinates=[];

    const lineArray=objText.split('\n');
    for (const line of lineArray){
        const letters=line.trim().split(/\s+/);
        if (letters[0]=== "v"){
            vertices.push(letters.slice(1).map(Number));
        }else if(letters[0]==="f"){
            faces.push(letters.slice(1).map(face => face.split("/")[0]-1));
        }
    }

    for (const face of faces){
        for (const face2 of face){
            coordinates.push(...vertices[face2]);
        }
    }

    return new Float32Array(coordinates);

}
function animateZoom(matrix, time) {
    const scale = Math.sin(time * 0.001) * 0.5 + 1;
    matrix[0] = scale; matrix[5] = scale; matrix[10] = scale;
}

function animateRotation(matrix, time) {
    const angle = time * 0.001;
    matrix[0] = Math.cos(angle);
    matrix[2] = Math.sin(angle);
    matrix[8] = -Math.sin(angle);
    matrix[10] = Math.cos(angle);
}

function animateUpDown(matrix, time) {
    const offset = Math.sin(time * 0.001) * 0.5;
    matrix[13] += offset;
}

function createIdentityMatrix() {
    return [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ]
}

function perspective(fov, aspect, near, far) {
    const f = 1/ Math.tan(fov);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
    ];
}

function createModelMatrix(position) {
    const matrix = createIdentityMatrix();
    matrix[12] = position[0];
    matrix[13] = position[1];
    matrix[14] = position[2];
    return matrix;
}

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('wheel', onWheel)
canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0 || event.button === 2) {
        event.preventDefault();
    }
});


function onMouseDown(event) {
    isDragging = true;
    lastMousePos.x = event.clientX;
    lastMousePos.y = event.clientY;
}

function onMouseMove(event) {
    if (!isDragging) return;

    const deltaX = event.movementX * 0.001;
    const deltaY = event.movementY * 0.001;

    lastMousePos.x = event.clientX;
    lastMousePos.y = event.clientY;

    if (event.buttons === 1) { // Left mouse button: Rotate camera
        horizontalAngle += deltaX;
        verticalAngle += deltaY;

        // Clamp the vertical angle to avoid gimbal lock
        verticalAngle = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, verticalAngle));

        cameraPosition[0] = cameraRadius * Math.cos(verticalAngle) * Math.sin(horizontalAngle) + panOffsetX;
        cameraPosition[1] = cameraRadius * Math.sin(verticalAngle) + panOffsetY;
        cameraPosition[2] = cameraRadius * Math.cos(verticalAngle) * Math.cos(horizontalAngle);
    }

    if (event.buttons === 2) { // Right mouse button: Pan camera
        panOffsetX -= deltaX * 10;
        panOffsetY -= deltaY * 10;

        cameraPosition[0] = panOffsetX + cameraRotationX;
        cameraPosition[1] = panOffsetY + cameraRotationY;
        cameraCenter[0] = panOffsetX;
        cameraCenter[1] = panOffsetY;
    }

    viewMatrix = lookAt(cameraPosition, cameraCenter, cameraUp);
    gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
}

function onMouseUp() {
    isDragging = false;
}



function onWheel(event) {
    cameraPosition[2] += event.deltaY * 0.05;
    //cameraPosition[2] = Math.max(5, Math.min(95, cameraPosition[2]));
    rotZ += event.deltaY * 0.05;
}

function lookAt(eye, center, up) {
    const f = normalize([
        center[0] - eye[0],
        center[1] - eye[1],
        center[2] - eye[2]
    ]);
    const s = normalize(cross(up, f));
    const u = cross(f, s);

    const result = createIdentityMatrix();
    result[0] = s[0]; result[4] = s[1]; result[8] = s[2];
    result[1] = u[0]; result[5] = u[1]; result[9] = u[2];
    result[2] = -f[0]; result[6] = -f[1]; result[10] = -f[2];
    result[12] = dot(s, eye);
    result[13] = dot(u, eye);
    result[14] = dot(f, eye);

    return result;
}

function normalize(v) {
    const len = Math.sqrt((v[0] * v[0]) + (v[1] * v[1]) + (v[2] * v[2]));
    return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}


main();


