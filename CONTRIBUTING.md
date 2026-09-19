# Contributing

Keep the system view logo-only and readable on the 480×320 baseline. Check
4:3 and 5:3 framing after layout changes. Prefer small textures, simple
shaders and optional effects suitable for RK3326 handhelds.

Before proposing changes:

```sh
python3 tools/validate-theme.py
python3 tools/check-shader.py
node --check preview/app.js
python3 tools/build-preview.py
python3 tools/build-shader-preview.py
python3 tools/package-theme.py
```

Commit the generated preview pages together with their source changes.
`preview/index.html` is built from `template.html`, `styles.css`, `app.js`
and its three bundled logo assets. `preview/native.html` embeds the exact
native shader and is built from `native-template.html`.

Record additional validation in `docs/COMPATIBILITY.md`. Browser screenshots
must be labeled as browser screenshots; hardware-tested claims must name
the device and firmware build. Check rapid scrolling, theme changes, menus,
game lists and returning from a game on the actual device.

Keep imported assets unchanged unless a visual change is intentional. Add
source and license information to `CREDITS.md`, and update the provenance
manifest for new or deliberately replaced imports. Do not present a changed
upstream file as the original hash.
