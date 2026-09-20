"""Check actual theme variants, paths, ES properties and asset provenance.

This checks the subset of XML used by this theme; it is not an ES emulator.
"""
import hashlib
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / 'tools/theme-schema.json').read_text())['elements']
UNIFORMS = set(re.findall(r'uniform\s+\w+\s+(water\w+)\s*;', (ROOT / 'assets/shaders/water.glsl').read_text()))
SIZES = [(480, 320), (640, 480), (1920, 1152)]
MODES = ('animated', 'still', 'calm')
CACHE = {}


def xml(path):
    if path not in CACHE:
        CACHE[path] = ET.parse(path).getroot()
    return CACHE[path]


def resolve(text, variables):
    def sub(match):
        key = match[1]
        assert key in variables, f'Unknown variable {key}'
        return str(variables[key])
    return re.sub(r'\$\{([^}]+)\}', sub, text or '')


def allowed(node, variables, modes):
    condition = node.get('if')
    if condition:
        for part in condition.split('&&'):
            match = re.fullmatch(r"\$\{([^}]+)\}\s*(==|!=|<)\s*(.+)", part.strip())
            assert match, f'Unsupported condition in validator: {condition}'
            lhs = variables[match[1]]
            rhs = match[3].strip()
            rhs = rhs[1:-1] if rhs.startswith("'") else float(rhs)
            if match[2] == '==':
                passes = str(lhs) == str(rhs)
            elif match[2] == '!=':
                passes = str(lhs) != str(rhs)
            else:
                passes = float(lhs) < rhs
            if not passes:
                return False
    subset = node.get('ifSubset')
    if subset:
        name, choices = subset.split(':')
        assert name in modes
        return modes[name] in choices.split('|')
    return True


def check_value(kind, value, file):
    if kind in ('FLOAT', 'NORMALIZED_PAIR', 'NORMALIZED_RECT'):
        count = {'FLOAT': 1, 'NORMALIZED_PAIR': 2, 'NORMALIZED_RECT': 4}[kind]
        assert len(value.split()) == count, (file, kind, value)
        for n in value.split():
            float(n)
    elif kind == 'COLOR':
        assert re.fullmatch(r'[0-9a-fA-F]{6}([0-9a-fA-F]{2})?', value), (file, value)
    elif kind == 'BOOLEAN':
        assert value in ('true', 'false', '0', '1'), (file, value)


def check_element(element, file, variables, modes):
    assert element.tag in SCHEMA, (file, element.tag)
    fields = dict(SCHEMA[element.tag])
    shader = element.find('shader')
    parameters = set()
    if shader is not None:
        parameters = {p.tag for p in shader if p.tag != 'path'}
        assert parameters == UNIFORMS, ('Shader parameters mismatch', parameters ^ UNIFORMS)
    previous_path = None
    for prop in element:
        if not allowed(prop, variables, modes):
            continue
        if prop.tag == 'shader':
            shader_file = (file.parent / resolve(prop.findtext('path'), variables)).resolve()
            assert shader_file.is_file(), shader_file
            for uniform in prop:
                resolve(uniform.text, variables)
            continue
        if prop.tag == 'storyboard':
            for animation in prop:
                name = animation.get('property')
                if name.startswith('shader.'):
                    assert name[7:] in parameters, name
                else:
                    assert name in fields, name
                for key in ('from', 'to'):
                    if key in animation.attrib:
                        value = resolve(animation.get(key), variables)
                        kind = fields.get(name, 'FLOAT')
                        check_value(kind, value, file)
                assert int(animation.get('duration', '0')) > 0
            continue
        assert prop.tag in fields, f'{file.name}: unsupported {element.tag}.{prop.tag}'
        value = resolve(prop.text, variables)
        check_value(fields[prop.tag], value, file)
        if fields[prop.tag] == 'PATH':
            target = (file.parent / value).resolve()
            if not target.is_file():
                # ES retains the preceding fallback path for an unknown system.
                assert prop.tag == 'path' and previous_path and target.parent == ROOT / 'assets/logos', target
            else:
                previous_path = target


def load(file, variables, modes, stack=()):
    file = file.resolve()
    assert file not in stack, f'Cyclic include: {file}'
    tree = xml(file)
    assert tree.tag == 'theme' and tree.findtext('formatVersion') == '7', file
    views = set()
    for node in tree:
        if not allowed(node, variables, modes):
            continue
        if node.tag == 'variables':
            for var in node:
                if allowed(var, variables, modes):
                    variables[var.tag] = resolve(var.text, variables)
        elif node.tag == 'include':
            views |= load(file.parent / resolve(node.text, variables), variables, modes, stack + (file,))
        elif node.tag == 'subset':
            selected = [inc for inc in node if inc.get('name') == modes.get(node.get('name'))]
            assert len(selected) == 1
            views |= load(file.parent / selected[0].text, variables, modes, stack + (file,))
        elif node.tag == 'view':
            views.update(node.get('name').split(','))
            for element in node:
                if allowed(element, variables, modes):
                    check_element(element, file, variables, modes)
    return views


def main():
    manifest = json.loads((ROOT / 'docs/upstream/assets.json').read_text())
    for asset in manifest['files']:
        assert hashlib.sha256((ROOT / asset['path']).read_bytes()).hexdigest() == asset['sha256'], asset['path']
    logos = sorted((ROOT / 'assets/logos').glob('*.svg'))
    for logo in logos:
        assert xml(logo).tag.endswith('svg'), logo
    cases = 0
    colors = ('white', 'gold', 'silver', 'neon-blue', 'neon-red', 'neon-green', 'neon-yellow')
    for system in [p.stem for p in logos] + ['unknown-system']:
        for width, height in SIZES:
            for mode in MODES:
                for color in colors:
                    variables = {'themePath': str(ROOT), 'system.theme': system, 'system.fullName': system,
                                 'system.manufacturer': '' if system == 'unknown-system' else 'Test',
                                 'system.name': system,
                                 'system.collection': '0',
                                 'screen.width': width, 'screen.height': height}
                    views = load(ROOT / 'theme.xml', variables,
                                 {'water-effects': mode, 'water-colors': color})
                    assert {'system', 'basic', 'detailed', 'video', 'menu'} <= views
                    cases += 1
    print(f'Validated {cases} system/screen/effect combinations, {len(logos)} logos and upstream hashes.')


if __name__ == '__main__':
    main()
