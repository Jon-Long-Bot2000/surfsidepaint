#!/usr/bin/env python3
"""Create, build, preview, and stage independent Surfside proposals. Never pushes Git."""
import argparse
import copy
from datetime import datetime
import hashlib
from html import escape
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit
from uuid import uuid4
from zoneinfo import ZoneInfo

PACKAGE = Path(__file__).resolve().parent
VERSION = (PACKAGE/'VERSION').read_text().strip()
IMAGE_TYPES = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
SLUG = re.compile(r'[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\Z')


def read_json(path):
    return json.loads(Path(path).read_text())


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')


def repo_root():
    for directory in PACKAGE.parents:
        if (directory/'.git').exists():
            return directory
    raise ValueError('Run from the installed workflow inside the surfsidepaint repository.')


def safe_slug(value):
    if not SLUG.fullmatch(value) or len(value) > 100:
        raise ValueError('Use a URL slug containing letters, digits and single hyphens, at most 100 characters.')
    return value


def slugify(address):
    return safe_slug(re.sub(r'[^a-z0-9]+', '-', address.lower()).strip('-'))


def load_project(project):
    from interactive_project import validate
    project=Path(project).resolve()
    data=read_json(project/'proposal-details.json')
    validate(data)
    return project,data


def create_project(address, slug=None, projects_dir=None):
    from interactive_project import create
    return create(address,slug,projects_dir)


def missing_fields(data):
    from interactive_project import missing
    return missing(data)


def within(project, relative):
    path = Path(relative)
    if path.is_absolute():
        raise ValueError('Asset paths must be relative to the project folder.')
    resolved = (project/path).resolve()
    if not resolved.is_relative_to(project):
        raise ValueError('Asset path leaves the project folder: '+str(relative))
    if not resolved.is_file():
        raise ValueError('Missing asset: '+str(relative))
    return resolved


def fingerprint(project):
    digest = hashlib.sha256()
    paths = [project/'proposal-details.json'] + sorted((project/'assets').rglob('*'))
    for path in paths:
        if path.is_symlink():
            raise ValueError('Project assets cannot contain symbolic links.')
        if path.is_file():
            digest.update(path.relative_to(project).as_posix().encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()


def decoded_image(source, scratch):
    from PIL import Image, ImageOps
    if source.suffix.lower() in {'.heic', '.heif'}:
        converter = shutil.which('heif-convert')
        if not converter:
            raise ValueError('HEIC photos need heif-convert. Use JPG, PNG or WebP, or install libheif.')
        target = scratch/(uuid4().hex+'.jpg')
        subprocess.run([converter, str(source), str(target)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        source = target
    with Image.open(source) as original:
        return ImageOps.exif_transpose(original).convert('RGB')


def content_hashes(directory):
    return {p.relative_to(directory).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(directory.rglob('*')) if p.is_file()}


class AssetCheck(HTMLParser):
    def __init__(self, site):
        super().__init__()
        self.site = site
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'input' and attrs.get('type') == 'file':
            raise ValueError('Photo upload inputs are disabled for this template.')
        for key in ['src', 'href']:
            url = urlsplit(attrs.get(key, ''))
            if url.path and not url.scheme and not url.netloc and not url.path.startswith('/'):
                target = (self.site/unquote(url.path)).resolve()
                if not target.is_relative_to(self.site.resolve()) or not target.is_file():
                    raise ValueError('Broken asset reference: '+url.path)


def check_site(site):
    from interactive_project import check_site as validate_site
    return validate_site(site)


def build_project(project, final=False):
    from interactive_project import build
    return build(project,final)


def stage_project(project, repo):
    project, data = load_project(project)
    repo = Path(repo).resolve()
    if not (repo/'.git').exists():
        raise ValueError('Stage into the surfsidepaint Git repository root.')
    report = read_json(project/'output/build.json')
    if report.get('status') != 'final' or report.get('project_id') != data['project_id']:
        raise ValueError('Only this project\'s final build can be staged. Build with --final after review.')
    if missing_fields(data) or report['source_sha256'] != fingerprint(project):
        raise ValueError('Project inputs changed or are incomplete. Rebuild and review before staging.')
    site = project/'output/site'
    if content_hashes(site) != report['files']:
        raise ValueError('Built files changed after validation. Rebuild and review before staging.')
    check_site(site)
    matches = [p for p in repo.iterdir() if p.name.casefold() == data['slug'].casefold()]
    target = repo/data['slug']
    if matches:
        existing = matches[0]
        if existing != target or existing.is_symlink() or not existing.is_dir():
            raise ValueError('URL collides with another file, folder or capitalization.')
        marker = existing/'proposal-project.json'
        if not marker.is_file() or read_json(marker).get('project_id') != data['project_id']:
            raise ValueError('This URL belongs to another project. Refusing to overwrite it.')
    temporary = Path(tempfile.mkdtemp(prefix='.proposal-stage-', dir=repo))
    try:
        shutil.copytree(site, temporary/'site')
        if target.exists():
            target.rename(temporary/'previous')
        try:
            (temporary/'site').rename(target)
        except BaseException:
            if (temporary/'previous').exists():
                (temporary/'previous').rename(target)
            raise
    finally:
        shutil.rmtree(temporary)
    return target


def serve_project(project, port):
    project, data = load_project(project)
    site = project/'output/site'
    check_site(site)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(site), **kwargs)
        def list_directory(self, path):
            self.send_error(404)
    addresses = set()
    try:
        addresses.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
    if shutil.which('ipconfig'):
        result = subprocess.run(['ipconfig', 'getifaddr', 'en0'], capture_output=True, text=True)
        if result.returncode == 0:
            addresses.add(result.stdout.strip())
    print(f'Desktop preview: http://localhost:{port}/', flush=True)
    for address in sorted(addresses):
        if not address.startswith('127.'):
            print(f'Mobile preview (same Wi-Fi): http://{address}:{port}/', flush=True)
    server = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    new = commands.add_parser('new', help='Create separate local inputs; never publishes or switches Git.')
    new.add_argument('--confirm-create', action='store_true', required=True, help='Use only after explicit project creation approval.')
    new.add_argument('address'); new.add_argument('--slug'); new.add_argument('--projects-dir', type=Path)
    for name in ['intake', 'build', 'stage', 'serve', 'check', 'editor']:
        command = commands.add_parser(name)
        command.add_argument('project', type=Path)
        if name == 'build':
            command.add_argument('--final', action='store_true')
        elif name == 'stage':
            command.add_argument('--repo', type=Path, default=None)
        elif name in ['serve','editor']:
            command.add_argument('--port', type=int, default=4174)
    args = parser.parse_args()
    try:
        if args.command == 'new':
            project = create_project(args.address, args.slug, args.projects_dir)
            print(project)
            print('Next: run this project’s _template/proposal.py editor PROJECT --port AVAILABLE_PORT.')
        elif args.command == 'intake':
            _, data = load_project(args.project)
            print('\n'.join('- '+item for item in missing_fields(data)) or 'Intake complete. Build and review the final proposal.')
        elif args.command == 'build':
            site, report = build_project(args.project, args.final)
            print(site)
            print(f'{report["status"].title()}: {report["pdf_pages"]} PDF page(s). Interactive options; no Photo Gallery.')
            print('Inspect every rendered PDF page in output/pdf-pages before submission or publication.')
        elif args.command == 'stage':
            print(stage_project(args.project, args.repo or repo_root()))
            print('Staged only. Review the diff and obtain publication approval before pushing main.')
        elif args.command == 'editor':
            from editor_server import serve_editor
            serve_editor(args.project,args.port)
        elif args.command == 'serve':
            serve_project(args.project, args.port)
        elif args.command == 'check':
            project, _ = load_project(args.project)
            report = read_json(project/'output/build.json')
            if fingerprint(project) != report['source_sha256'] or content_hashes(project/'output/site') != report['files']:
                raise ValueError('Build is stale or changed; rebuild before review.')
            print(f'Build verified: {check_site(project/"output/site")} PDF page(s).')
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, 'Error: '+str(error)+'\n')


if __name__ == '__main__':
    main()
