/* Art Book Water. CC BY-NC-SA 2.0; see LICENSE.md.
 * ES supplies a vertically flipped texture, VertexCoord in local pixels,
 * outputSize, textureSize and MVPMatrix. No framebuffer pass is required.
 */
#if defined(VERTEX)
#if __VERSION__ >= 130
#define ATTRIBUTE in
#define VARYING out
#else
#define ATTRIBUTE attribute
#define VARYING varying
#endif
uniform mat4 MVPMatrix;
uniform vec2 outputSize;
ATTRIBUTE vec2 VertexCoord;
ATTRIBUTE vec2 TexCoord;
ATTRIBUTE vec4 COLOR;
VARYING vec2 sceneUV;
VARYING vec4 tint;
void main() {
    gl_Position = MVPMatrix * vec4(VertexCoord, 0.0, 1.0);
    sceneUV = VertexCoord / max(abs(outputSize), vec2(1.0));
    tint = COLOR;
}
#elif defined(FRAGMENT)
#if __VERSION__ >= 130
#define VARYING in
#define SAMPLE texture
out vec4 FragColor;
#else
#define VARYING varying
#define SAMPLE texture2D
#define FragColor gl_FragColor
#endif
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
VARYING vec2 sceneUV;
VARYING vec4 tint;
uniform sampler2D u_tex;
uniform vec2 outputSize;
uniform vec2 textureSize;
uniform vec4 waterAccent;
uniform float waterPhase;
uniform float waterAge;
uniform float waterMotion;
uniform float waterFloat;
uniform float waterWave;
uniform float waterReflection;
uniform float waterLight;
uniform float waterLogoWidth;
uniform float waterLogoHeight;
const float PI = 3.14159265359;
const float SURFACE = 0.555;

float halo(vec2 p, vec2 center, vec2 radius) {
    float d = length((p - center) / radius);
    float a = max(0.0, 1.0 - d);
    return a * a;
}

vec4 logoAt(vec2 p, vec2 center, vec2 size) {
    vec2 uv = (p - center) / size + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
    // ImageIO::flipPixelsVert uses the GL texture origin at the bottom.
    return SAMPLE(u_tex, vec2(uv.x, 1.0 - uv.y));
}

void main() {
    vec2 p = sceneUV;
    float aspect = abs(outputSize.x / max(abs(outputSize.y), 1.0));
    float logoAspect = textureSize.x / max(textureSize.y, 1.0);
    float height = min(waterLogoHeight, waterLogoWidth * aspect / logoAspect);
    vec2 size = vec2(height * logoAspect / aspect, height);
    float phase = waterPhase * 2.0 * PI;
    float age = waterAge;
    float entrance = mix(1.0, smoothstep(0.0, 0.46, age), waterMotion);
    vec2 center = vec2(0.5 + 0.045 * (1.0 - entrance), 0.40 + sin(phase) * waterFloat * waterMotion);
    vec3 accent = waterAccent.rgb;
    vec3 color = mix(vec3(0.027, 0.039, 0.063), vec3(0.067, 0.082, 0.122), min(p.y / SURFACE, 1.0));
    color += accent * halo(p, vec2(0.5, 0.52), vec2(0.47, 0.40)) * 0.13 * waterLight;
    if (p.y >= SURFACE) {
        float depth = (p.y - SURFACE) / 0.285;
        color = mix(vec3(0.047, 0.063, 0.094), vec3(0.031, 0.047, 0.075), clamp(depth, 0.0, 1.0));
        color += accent * halo(p, vec2(0.5, SURFACE), vec2(0.45, 0.25)) * 0.11 * waterLight;
        float burst = sin(PI * clamp(age / 1.7, 0.0, 1.0)) * exp(-age * 0.65) * waterMotion;
        float front = exp(-pow((depth - age * 0.65) * 6.0, 2.0));
        float calm = sin((p.y - SURFACE) * 48.0 - phase) + 0.28 * sin((p.y - SURFACE) * 124.8 + phase * 2.0);
        float disturbance = sin(depth * 30.0 - age * 15.0) * burst * front * 5.0;
        float wave = (calm * (0.25 + depth) * waterMotion + disturbance) * waterWave / aspect;
        vec2 reflected = vec2(p.x - wave, SURFACE - (p.y - SURFACE) / 0.88);
        vec4 sampleColor = logoAt(reflected, center, size);
        float fade = exp(-max(depth, 0.0) * 1.7) * (1.0 - smoothstep(0.68, 1.0, depth));
        color = mix(color, sampleColor.rgb, sampleColor.a * waterReflection * fade * entrance);
        // Three expanding elliptical highlights, confined to the water.
        for (int i = 0; i < 3; i++) {
            float progress = clamp((age - float(i) * 0.13) / 1.55, 0.0, 1.0);
            float radius = 0.04 + progress * 0.61;
            vec2 ring = vec2(p.x - 0.5, (p.y - SURFACE - 0.024) / (aspect * 0.19));
            float distanceToRing = abs(length(ring) - radius);
            float lineWidth = 0.0018 / aspect;
            float line = 1.0 - smoothstep(lineWidth, lineWidth * 2.0, distanceToRing);
            color += accent * line * sin(progress * PI) * (1.0 - progress) * 0.15 * waterLight * waterMotion * min(waterWave * 320.0, 1.5);
        }
    } else {
        vec4 sampleColor = logoAt(p, center, size);
        color = mix(color, sampleColor.rgb, sampleColor.a * entrance);
    }
    color += accent * halo(p, vec2(0.5, SURFACE), vec2(0.38, 0.035)) * 0.09 * waterLight;
    float horizon = (1.0 - smoothstep(0.0007, 0.0023, abs(p.y - SURFACE))) * max(0.0, 1.0 - abs(p.x - 0.5) / 0.38);
    color += accent * horizon * 0.11 * waterLight;
    FragColor = vec4(color * tint.rgb, tint.a);
}
#endif
