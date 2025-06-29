uniform sampler2D caustics;
uniform vec3 baseColor;

varying float lightIntensity;
varying vec3 lightPosition;
varying vec3 vColor;

const float bias = 0.001;

//바다색 영향
const vec3 underwaterColor = vec3(0.3, 0.7, 0.9);
// 수중 색상 영향 비율(낮출수록 원색 유지)
const float underwaterInfluence = 0.03  ;

const vec2 resolution = vec2(1024.);

float blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  float intensity = 0.;
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  intensity += texture2D(image, uv).x * 0.2270270270;
  intensity += texture2D(image, uv + (off1 / resolution)).x * 0.3162162162;
  intensity += texture2D(image, uv - (off1 / resolution)).x * 0.3162162162;
  intensity += texture2D(image, uv + (off2 / resolution)).x * 0.0702702703;
  intensity += texture2D(image, uv - (off2 / resolution)).x * 0.0702702703;
  return intensity;
}

void main() {
  // Set the frag color
  float computedLightIntensity = 0.9;

  computedLightIntensity += 0.2 * lightIntensity;

  // Retrieve caustics depth information
  float causticsDepth = texture2D(caustics, lightPosition.xy).w;

  if (causticsDepth > lightPosition.z - bias) {
    // Percentage Close Filtering
    float causticsIntensity = 0.5 * (
      blur(caustics, lightPosition.xy, resolution, vec2(0., 0.5)) +
      blur(caustics, lightPosition.xy, resolution, vec2(0.5, 0.))
    );

    computedLightIntensity += causticsIntensity * smoothstep(0., 1., lightIntensity);;
  }

  // 원래 색상과 물 속 색상을 혼합 (baseColor 대신 vColor 사용)
  vec3 finalColor = mix(vColor, underwaterColor, underwaterInfluence) * computedLightIntensity;
  gl_FragColor = vec4(finalColor, 1.0);
}
