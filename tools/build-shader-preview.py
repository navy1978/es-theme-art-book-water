"""Bundle the actual native GLSL source into a standalone WebGL1 harness."""
import base64
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
logos = {
    key: 'data:image/svg+xml;base64,' + base64.b64encode((root / 'assets/logos' / (key + '.svg')).read_bytes()).decode()
    for key in ('dreamcast', 'snes', 'megadrive')
}
text = (root / 'preview/native-template.html').read_text()
text = text.replace('/* __SHADER__ */', json.dumps((root / 'assets/shaders/water.glsl').read_text()))
text = text.replace('/* __ASSETS__ */', json.dumps(logos))
(root / 'preview/native.html').write_text(text)
print('Built preview/native.html with the actual water.glsl source')
