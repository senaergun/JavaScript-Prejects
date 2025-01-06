"use strict";

main();

function main(){
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext("webgl2");

    if(!gl){
        alert("Unable to initialize WebGL.");
        return;
    }
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);


    const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    const colorLocation = gl.getUniformLocation(shaderProgram, "uColor");
    const uAngleLocation = gl.getUniformLocation(shaderProgram, "uAngle");
    const numPoints = 100;

    // Calculating border points of handle
    const bezierPoints = [];

    const rightTop = [0.025, 0.4];
    const rightBottom = [0.025, -0.4];
    const leftTop = [-0.025, 0.4];
    const leftBottom = [-0.025, -0.4];

    const p0 = [-0.025, 0.4];
    const p1 = [ 0.0,  0.45];
    const p2 = [ 0.025, 0.4];

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPoints.push(...calculateBezierPoint(t, p0, p1, p2));
    }

    bezierPoints.push(rightBottom[0], rightBottom[1]);

    p0[0] = rightBottom[0];
    p0[1] = rightBottom[1];

    p1[0] = -0.1125;
    p1[1] = -0.6;

    p2[0] = -0.25;
    p2[1] = -0.4;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPoints.push(...calculateBezierPoint(t, p0, p1, p2));
    }

    bezierPoints.push(-0.23, -0.4);

    p0[0] = -0.23;
    p0[1] = -0.4;

    p1[0] = -0.127;
    p1[1] = -0.47;

    p2[0] = leftBottom[0];
    p2[1] = leftBottom[1];

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPoints.push(...calculateBezierPoint(t, p0, p1, p2));
    }

    bezierPoints.push(leftTop[0], leftTop[1]);
    const triangleIndices = earClipping(bezierPoints);

    const bezierBuffer = createBuffer(gl, new Float32Array(bezierPoints));
    const indicesBuffer = createElementBuffer(gl, new Uint16Array(triangleIndices));

    // Calculating border points of fabric
    const bezierPointsFabric = [];

    const p3 = [-0.5, 0.1];
    const p4 = [ 0.0,  0.63];
    const p5 = [ 0.5, 0.1];

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPointsFabric.push(...calculateBezierPoint(t, p3, p4, p5));
    }

    p3[0] = 0.5;
    p3[1] = 0.1;

    p4[0] = 0.3333333333;
    p4[1] = 0.2;

    p5[0] = 0.1666666;
    p5[1] = 0.1;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPointsFabric.push(...calculateBezierPoint(t, p3, p4, p5));
    }

    p3[0] = p5[0];
    p3[1] = p5[1];

    p4[0] = 0;
    p4[1] = 0.2;

    p5[0] = -0.1666666;
    p5[1] = 0.1;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPointsFabric.push(...calculateBezierPoint(t, p3, p4, p5));
    }

    p3[0] = p5[0];
    p3[1] = p5[1];

    p4[0] = -0.3333333333;
    p4[1] = 0.2;

    p5[0] = -0.5;
    p5[1] = 0.1;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        bezierPointsFabric.push(...calculateBezierPoint(t, p3, p4, p5));
    }


    //ASSIGNMENT 2

    let isRotating =false;
    let isColorChanging = false;
    let uAngle = 0;


    // Check mouse movements
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - canvas.width / 2;
        const rotationSpeed = Math.abs(mouseX) / (canvas.width / 2); // Fare konumuna göre hız belirle
        uAngle += mouseX > 0 ? rotationSpeed : -rotationSpeed; // Yöne göre dönüş
        gl.uniform1f(uAngleLocation, uAngle);
    });

    // Check keyboard
    document.addEventListener('keydown', (event) => {
        if (event.key === 'r') {
            reset();
        } else if (event.key === 'm') {
            isRotating = true;
            isColorChanging = false;
        } else if (event.key === 'c') {
            isRotating = true;
            isColorChanging = true;
        }
    });

    render();

    // Functions

    function reset(){
        isRotating =false;
        isColorChanging = false;
        uAngle = 0.0;
        gl.uniform1f(uAngleLocation, uAngle);
        gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);

    }

    function drawHandle() {
        gl.bindBuffer(gl.ARRAY_BUFFER, bezierBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
        gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);
        gl.drawElements(gl.TRIANGLES, triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    function drawFabric() {
        const triangleIndicesFabric = earClipping(bezierPointsFabric);
        const bezierBufferFabric = createBuffer(gl, new Float32Array(bezierPointsFabric));
        const indicesBufferFabric = createElementBuffer(gl, new Uint16Array(triangleIndicesFabric));

        gl.bindBuffer(gl.ARRAY_BUFFER, bezierBufferFabric);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBufferFabric);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
        if (isColorChanging) {
            const randomColor = [Math.random(), Math.random(), Math.random(), 1.0]
            gl.uniform4fv(colorLocation, randomColor);
        } else {
            gl.uniform4f(colorLocation, 1.0, 1.0, 0.0, 1.0);
        }
        gl.drawElements(gl.TRIANGLES, triangleIndicesFabric.length, gl.UNSIGNED_SHORT, 0);

    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (isRotating) {
            gl.uniform1f(uAngleLocation, uAngle);
        } else {
            gl.uniform1f(uAngleLocation, 0.0); // Reset angle if rotation is off
        }

        drawHandle();
        drawFabric();

        requestAnimationFrame(render);
    }

    function calculateBezierPoint(t, p0, p1, p2) {
        const x = Math.pow(1 - t, 2) * p0[0] + 2 * (1 - t) * t * p1[0] + Math.pow(t, 2) * p2[0];
        const y = Math.pow(1 - t, 2) * p0[1] + 2 * (1 - t) * t * p1[1] + Math.pow(t, 2) * p2[1];
        return [x, y];
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

    function isPointInTriangle(p, p0, p1, p2) {
        const [px, py] = p;
        const [x0, y0] = p0;
        const [x1, y1] = p1;
        const [x2, y2] = p2;

        const d1 = (x1 - x0) * (py - y0) - (y1 - y0) * (px - x0);
        const d2 = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
        const d3 = (x0 - x2) * (py - y2) - (y0 - y2) * (px - x2);

        return (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
    }
}



