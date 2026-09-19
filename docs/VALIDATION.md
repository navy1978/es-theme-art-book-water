# Validation report — 2026-09-18

## Native project files

- `python3 tools/validate-theme.py`: passed **1,728** combinations
  (191 bundled identifiers + an unknown identifier, three screen sizes,
  three effect modes).
- Theme property schema checked against AmberELEC EmulationStation
  `c34e9cf3f6a22afbb47266fe89db4379513d1f03`.
- Include paths, resource paths, variable references, shader parameter
  wiring, fallback logo and imported asset hashes checked.
- `python3 tools/check-shader.py`: vertex and fragment stages compiled and
  linked for **GLSL ES 1.00**, **GLSL 1.20** and **GLSL 1.30** with glslang.
- Installable ZIP generated with only theme resources and documentation.

## Actual shader rendering

The exact `assets/shaders/water.glsl` was compiled and rendered in Chrome
WebGL 1 using the software ANGLE/SwiftShader backend:

| Logo | 480×320 | 640×480 | 1920×1152 |
| --- | --- | --- | --- |
| Dreamcast | Pass | Pass | Pass |
| Super Nintendo | Pass | Pass | Pass |
| Mega Drive | Pass | Pass | Pass |

No WebGL error or JavaScript exception was reported in these nine renders.
Visual inspection confirmed upright source logos and inverted reflections.
The harness rasterizes SVGs before GL upload and flips them vertically,
matching the native engine's texture convention. Native SVG rasterization
uses NanoSVG; the browser uses its own SVG renderer.

The harness is `preview/native.html`. Its rendered PNGs start with
`preview/native-`. This is a shader test, **not** a native EmulationStation
or handheld test and not a performance benchmark.

## Browser design concept

The independent Canvas concept passed console navigation, rapid repeated
navigation, pause stability, automatic demo and reduced-motion checks.
All three target formats were rendered. The 390-pixel mobile page had no
horizontal overflow. JavaScript syntax was checked with Node.

## Still required

No device was modified or used for testing. SystemView lifecycle, menu and
game-list behavior, video playback, resource usage and handheld GPU
performance remain unverified. See [COMPATIBILITY.md](COMPATIBILITY.md).
