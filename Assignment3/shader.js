const vertexShaderSource = `
attribute vec2 aPosition;
uniform vec2 uTranslation;  
uniform float uRotation;  
uniform float uScale;  
void main() {
  float cosTheta = cos(uRotation);
  float sinTheta = sin(uRotation);
  mat3 scaleMatrix = mat3(uScale, 0.0, 0.0, 0.0, uScale, 0.0, 0.0, 0.0, 1.0);
  mat3 rotationMatrix = mat3(cosTheta, -sinTheta, 0.0, sinTheta, cosTheta, 0.0, 0.0, 0.0, 1.0);
  vec2 translatedPosition = vec2(aPosition.x + uTranslation.x, aPosition.y + uTranslation.y);  
  vec3 transformedPosition = rotationMatrix * scaleMatrix  * vec3(translatedPosition, 1.0);
  
  gl_Position = vec4(transformedPosition.xy, 0.0, 1.0);
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}`;
