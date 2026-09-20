# Installation on AmberELEC

This is an early native theme. Hardware performance and the complete ES view
lifecycle still need validation; see [COMPATIBILITY.md](COMPATIBILITY.md).

1. Download the repository ZIP, or build `dist/es-theme-art-book-water.zip`
   with `python3 tools/package-theme.py`.
2. Extract it into a folder named `es-theme-art-book-water`.
3. Copy that folder to:

   `/storage/.config/emulationstation/themes/es-theme-art-book-water/`

   The resulting file must be
   `/storage/.config/emulationstation/themes/es-theme-art-book-water/theme.xml`.
   Avoid an extra nested directory introduced by ZIP extraction.
4. Restart EmulationStation if the theme is not listed.
5. Open **UI Settings → Theme Set** and select **es-theme-art-book-water**.

Do not overwrite the built-in Art Book Next theme. To remove this theme,
select another theme first, then delete only the `es-theme-art-book-water`
folder.

## Theme configuration

Under **UI Settings → Theme Configuration → Water effects**:

| Setting | Behavior |
| --- | --- |
| Water (animated) | Floating logo, fading reflection and entry ripple; requires custom GLSL image shaders and storyboards. |
| Water (still) | Same shader scene with no continuous movement or entry ripple. |
| Calm (no shaders) | Standard image components, static logo and reflection; no custom shader or ongoing animation. |

The theme uses normalized coordinates and fits the original logo aspect
ratio automatically on 3:2, 4:3 and 5:3 displays. No device-specific copy is
needed. Fonts increase relative to screen height below 400 pixels.

Supported game list views: **Basic**, **Detailed**, **Video**. Use Basic when
no media has been scraped. Detailed shows an image and description; Video
uses the scraped video, with audio off. A dedicated Grid view is not included.

## Customization

Edit `_inc/settings.xml` for motion, light and reflection strength:

- `floatAmount`: normalized vertical amplitude, default `0.0078125`
  (±2.5 px on a screen 320 px high).
- `waveAmount`: normalized wave strength, default `0.003125`.
- `reflectionAmount`: default `0.55`.
- `lightAmount`: default `0.65`.

Edit `_inc/palette.xml` to set an accent for a system's theme identifier.
Unlisted systems use blue. Replace or add `assets/logos/<system.theme>.svg`
to customize a logo. Systems without an available logo show the generic
mark and their actual system name.

The browser's sliders are design controls. They do not change the device
configuration or edit these XML values.

## Future AmberELEC integration

The repository root is a normal EmulationStation theme set. A later
AmberELEC theme-catalog entry can point to its Git repository, branch and
preview. No firmware package changes, catalog changes or device installation
are part of this initial project. Validate on hardware first.
