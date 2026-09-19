"""Create an installable theme archive, excluding previews and development files."""
import subprocess
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root / 'tools/validate-theme.py')], check=True)
files = [root / 'theme.xml', root / 'README.md', root / 'LICENSE.md', root / 'CREDITS.md']
files += [p for p in (root / 'docs').rglob('*') if p.is_file() and p.name != 'PUBLICATION-PROPOSAL.md']
for directory in ('assets', '_inc'):
    files += [p for p in (root / directory).rglob('*') if p.is_file() and not p.name.startswith('.')]
dest = root / 'dist/es-theme-art-book-water.zip'
dest.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        info = zipfile.ZipInfo('es-theme-art-book-water/' + str(file.relative_to(root)), (2026, 9, 18, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes())
print(f'Created {dest} ({dest.stat().st_size:,} bytes; {len(files)} files)')
