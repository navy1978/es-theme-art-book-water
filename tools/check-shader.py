"""Compile and link the actual theme shader with glslangValidator."""
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
compiler = shutil.which('glslangValidator')
if not compiler:
    raise SystemExit('glslangValidator is required (Ubuntu: glslang-tools; Homebrew: glslang).')
source = (root / 'assets/shaders/water.glsl').read_text()
with tempfile.TemporaryDirectory(prefix='art-book-water-') as temp:
    for version in (100, 120, 130):
        files = []
        for stage, define in [('vert', 'VERTEX'), ('frag', 'FRAGMENT')]:
            file = Path(temp) / f'water-{version}.{stage}'
            file.write_text(f'#version {version}\n#define {define}\n' + source)
            files.append(str(file))
        subprocess.run([compiler, '-l', *files], check=True)
