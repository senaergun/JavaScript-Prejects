const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform float uAngle; 
void main() {
    float cosAngle = cos(uAngle);
    float sinAngle = sin(uAngle);

    mat2 rotationMatrix = mat2(
        cosAngle, -sinAngle,
        sinAngle, cosAngle
    );

    vec2 rotatedPosition = rotationMatrix * aPosition;
    gl_Position = vec4(rotatedPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() {
    outColor = uColor;  
}
`;

