# Compatibility and validation

## Intended devices

| Devices | Native UI resolution | Aspect | Hardware status |
| --- | --- | --- | --- |
| RG351P / RG351M | 480 × 320 | 3:2 | Not tested |
| RG351V / RG351MP | 640 × 480 | 4:3 | Not tested |
| RG552 | 1920 × 1152 | 5:3 | Not tested |

Target: **AmberELEC's EmulationStation fork**, theme format 7. This is not an
ES-DE theme. No compatibility claim is made for RetroPie, ArkOS or other ES
forks without separate testing.

Reference source:
https://github.com/AmberELEC/emulationstation/tree/c34e9cf3f6a22afbb47266fe89db4379513d1f03

The animated view uses `ImageComponent` custom shaders and storyboard float
uniforms. A default storyboard resets on the selected system's `onShow`:
`waterPhase` loops every 4.8 seconds while `waterAge` runs once to avoid
repeating the entry ripple. A still mode omits the storyboard. The Calm mode
uses ordinary image components only.

## What can be checked without a handheld

- XML properties against the pinned ES schema.
- Include paths, fonts, uniform wiring and fallback logo.
- All bundled system identifiers, an unknown identifier, three resolutions
  and all three effect modes.
- Provenance hashes for imported assets.
- Compilation/linking of the actual GLSL shader, including GLSL ES 1.00.
- Browser interaction and visual rendering of the concept and shader harness.

See [the recorded validation results](VALIDATION.md) for the checks run on
the initial development build.

These checks do **not** prove the native ES lifecycle, scrolling, memory
usage, video playback or GPU performance on the target devices. No hardware
FPS, battery-life or memory measurements have been made.

## Browser concept versus native theme

`preview/index.html` is the approved Canvas design study with three demo
systems and adjustable controls. The native implementation is `theme.xml`,
`_inc/` and `assets/`. The native scene uses a single image shader rather than
the browser's row-by-row Canvas reflection. ES controls system transitions;
their exact timing and appearance can differ from the concept. Native text
shows the actual system name and game count instead of demo-only counters.

The Calm mode intentionally simplifies the water to a static reflected logo
with no distortion. It is also available when diagnosing shader issues.
Shader failure does not automatically select Calm; choose it in Theme
Configuration.

## Hardware checks before calling a release stable

- Enter, leave and revisit systems; scroll quickly in both directions.
- Confirm every logo remains upright and every reflection inverted.
- Confirm the ripple runs once, then settles without a periodic flash.
- Open menus, change theme settings, enter/leave a game list and resume from
  the screensaver; watch for reset artifacts or animations running offscreen.
- Test unknown/custom systems, empty libraries, long names, missing scraped
  media, Basic/Detailed/Video lists and the no-shader mode.
- Measure menu responsiveness, memory and frame time on RG351 and RG552;
  inspect ES logs for unknown properties, missing resources and shader errors.
