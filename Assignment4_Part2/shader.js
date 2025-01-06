const vertexShaderSource = `#version 300 es
in vec4 a_position;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uScale;

void main() {
    mat4 scaleMatrix = mat4(
        uScale, 0.0, 0.0, 0.0,
        0.0, uScale, 0.0, 0.0,
        0.0, 0.0, uScale, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    gl_Position = uProjection * uView * uModel *scaleMatrix * a_position;
}`;


const fragmentShaderSource = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
    outColor = vec4(0.7, 0.7 ,0.7, 1.0);
}`;