"""Build the self-contained offline preview from its editable sources."""
import base64
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'preview'
logos = {
    name: 'data:image/svg+xml;base64,' + base64.b64encode((root / 'assets' / name).read_bytes()).decode()
    for name in ('dreamcast.svg', 'snes.svg', 'megadrive.svg')
}
html = (root / 'template.html').read_text()
for marker, contents in {
    '/* __CSS__ */': (root / 'styles.css').read_text(),
    '/* __LOGOS__ */': json.dumps(logos),
    '/* __APP__ */': (root / 'app.js').read_text(),
}.items():
    assert html.count(marker) == 1, marker
    html = html.replace(marker, contents)
(root / 'index.html').write_text(html)
print(f'Built {root / "index.html"} ({len(html.encode())} bytes)')
