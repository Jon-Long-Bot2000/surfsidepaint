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
    project = Path(project).resolve()
    data = read_json(project/'proposal-details.json')
    safe_slug(data['slug'])
    if data.get('template_version') != VERSION:
        raise ValueError('This project uses another template version. Use its matching workflow before rebuilding.')
    if not re.fullmatch(r'[a-f0-9]{32}', data.get('project_id', '')):
        raise ValueError('Invalid project identifier.')
    for key in ['project_name', 'site_address', 'business_name', 'date', 'summary', 'scope_paragraph', 'terms', 'schedule', 'materials']:
        if not isinstance(data.get(key, ''), str):
            raise ValueError(key+' must be plain text.')
    for party in ['prepared_by', 'prepared_for']:
        person = data.get(party)
        if not isinstance(person, dict) or not isinstance(person.get('address'), list) or not all(isinstance(line, str) for line in person['address']):
            raise ValueError(party+' must contain address lines as a list of text values.')
    if not isinstance(data.get('pricing'), list) or not all(isinstance(item, dict) for item in data['pricing']):
        raise ValueError('pricing must be a list of pricing records.')
    allowed_omissions = {'prepared_for.'+key for key in ['company', 'contact', 'address', 'phone', 'email']} | {'summary', 'schedule', 'materials', 'pricing', 'web.hero_image'}
    if not isinstance(data.get('omitted_fields'), list) or any(key not in allowed_omissions for key in data['omitted_fields']):
        raise ValueError('Only optional intake fields can be explicitly omitted; approval flags, site address and scope are required.')
    datetime.strptime(data['date'], '%B %d, %Y')
    return project, data


def create_project(address, slug=None, projects_dir=None):
    slug = safe_slug(slug) if slug else slugify(address)
    if not address.strip():
        raise ValueError('Provide the project address.')
    base = Path(projects_dir).resolve() if projects_dir else repo_root()/'_proposal-projects'
    if (base/slug).exists():
        raise ValueError('That project folder already exists. Open it to revise the existing proposal.')
    # Check public routes case-insensitively, including existing non-proposal pages.
    if any(p.name.casefold() == slug.casefold() for p in repo_root().iterdir()):
        raise ValueError('That URL already exists in the website. Choose another slug or revise its existing project.')
    base.mkdir(parents=True, exist_ok=True)
    if any(p.name.casefold() == slug.casefold() for p in base.iterdir()):
        raise ValueError('That project name already exists with different capitalization.')
    project = base/slug
    project.mkdir()
    for folder in ['assets/before', 'assets/after', 'output', 'tmp']:
        (project/folder).mkdir(parents=True)
    defaults = read_json(PACKAGE/'defaults.json')
    data = {
        'project_id': uuid4().hex, 'template_version': VERSION, 'slug': slug,
        'project_name': address.split(',')[0].strip(), 'site_address': address,
        'business_name': defaults['business_name'], 'prepared_by': defaults['prepared_by'],
        'date': datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%B %d, %Y').replace(' 0', ' '),
        'preview': True, 'branch': 'codex/proposal-'+slug.lower(),
        'prepared_for': {'company': '', 'contact': '', 'address': [], 'phone': '', 'email': ''},
        'summary': '', 'scope_paragraph': '', 'tasks': [],
        'pricing': [{'title': 'Fixed price', 'description': '', 'amount': None},
                    {'title': 'Materials', 'description': '', 'amount': None, 'amount_label': ''}],
        'pricing_pending': True, 'show_pricing_total': False,
        'schedule': '', 'materials': '', 'terms': '\n'.join(defaults['terms_candidates']),
        'terms_confirmed': False, 'pricing_confirmed': False,
        'omitted_fields': [], 'photos': [],
        'web': {'title': defaults['web_title'], 'hero_image': '', 'hero_alt': '', 'hero_caption': ''},
    }
    write_json(project/'proposal-details.json', data)
    (project/'INTAKE.md').write_text((PACKAGE/'INTAKE.md').read_text())
    (project/'.gitignore').write_text('*\n!.gitignore\n')
    shutil.copytree(PACKAGE, project/'_template', ignore=shutil.ignore_patterns('__pycache__', 'tmp', 'tests', '.openai'))
    return project


def missing_fields(data):
    missing = []
    omitted = set(data.get('omitted_fields', []))
    def require(key, value, label):
        if not value and key not in omitted:
            missing.append(label+' ['+key+']')
    for key in ['company', 'contact', 'address', 'phone', 'email']:
        require('prepared_for.'+key, data.get('prepared_for', {}).get(key), 'Contractor '+key)
    for key, label in [('site_address', 'Full project-site address'), ('summary', 'Project summary'),
                       ('schedule', 'Estimated schedule and dependencies'), ('materials', 'Materials responsibility and billing')]:
        require(key, data.get(key), label)
    require('scope', data.get('scope_paragraph') or data.get('tasks'), 'Scope of work and exclusions')
    pricing = data.get('pricing') or []
    if not pricing or any(item.get('amount') is None and item.get('amount_label') != '' for item in pricing):
        require('pricing', False, 'Confirmed price(s), or an explicit decision to omit pricing')
    require('pricing_confirmed', data.get('pricing_confirmed') is True, 'Pricing and material arrangements approved')
    require('terms_confirmed', data.get('terms_confirmed') is True, 'Project-specific terms approved')
    require('web.hero_image', data.get('web', {}).get('hero_image'), 'Hero photo, or an explicit decision to omit it')
    return missing


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


def gallery_cards(project, site, scratch, stage):
    folder = project/'assets'/stage
    sources = sorted(p for p in folder.rglob('*') if p.suffix.lower() in IMAGE_TYPES and p.is_file())
    cards = []
    for index, source in enumerate(sources, 1):
        source = within(project, source.relative_to(project))
        photo = decoded_image(source, scratch)
        photo.thumbnail((1800, 1800))
        filename = f'{index:03d}.webp'
        target = site/'gallery'/stage
        (target/'thumbs').mkdir(parents=True, exist_ok=True)
        photo.save(target/filename, quality=85, method=6)
        photo.thumbnail((640, 640))
        photo.save(target/'thumbs'/filename, quality=80, method=6)
        width, height = photo.size
        cards.append(f'<a class="gallery-photo" href="./gallery/{stage}/{filename}" aria-label="Open {stage} photo {index} of {len(sources)}">'
                     f'<img src="./gallery/{stage}/thumbs/{filename}" width="{width}" height="{height}" alt="{stage.title()} project photo {index} of {len(sources)}" loading="lazy" decoding="async">'
                     f'<span aria-hidden="true">{index:02d}</span></a>')
    return '\n'.join(cards), len(sources)


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
    html = (site/'index.html').read_text()
    if re.search(r'@@[A-Z_]+@@', html):
        raise ValueError('Unreplaced template field.')
    AssetCheck(site).feed(html)
    js = (site/'gallery.mjs').read_text()
    if 'fetch(' in js or 'setInterval(' in js:
        raise ValueError('Shared gallery API calls are disabled for this template.')
    from pypdf import PdfReader
    pdf = next(site.glob('*_Surfside_Proposal.pdf'))
    reader = PdfReader(pdf)
    if not reader.pages or not all(page.extract_text().strip() for page in reader.pages):
        raise ValueError('The proposal PDF contains an empty page.')
    return len(reader.pages)


def build_project(project, final=False):
    project, data = load_project(project)
    missing = missing_fields(data)
    if final and missing:
        raise ValueError('Complete or explicitly omit these items before a final build:\n- '+'\n- '.join(missing))
    for item in data.get('pricing', []):
        amount = item.get('amount')
        if amount is not None and (isinstance(amount, bool) or not isinstance(amount, (int, float)) or not math.isfinite(amount) or amount < 0):
            raise ValueError('Pricing amounts must be nonnegative numbers or null.')
    source_hash = fingerprint(project)
    output = project/'output'
    output.mkdir(exist_ok=True)
    scratch = Path(tempfile.mkdtemp(prefix='proposal-build-', dir=project/'tmp'))
    site = scratch/'site'
    shutil.copytree(PACKAGE/'template/site', site)
    try:
        render = copy.deepcopy(data)
        render['preview'] = not final
        render['preview_note'] = 'DRAFT - Not approved for submission'
        render['summary'] = render.get('summary') or ('' if final and 'summary' in data.get('omitted_fields', []) else '[Project summary to be provided]')
        if not render.get('scope_paragraph') and not render.get('tasks'):
            render['scope_paragraph'] = '[Scope of work to be provided]'
        if 'pricing' in data.get('omitted_fields', []):
            render['pricing'] = [{'title': 'Pricing', 'description': '', 'amount': None, 'amount_label': ''}]
        if render.get('schedule') or render.get('materials'):
            render['pricing'] = list(render.get('pricing') or [{'title': 'Proposal price', 'amount': None}])
        if render.get('schedule'):
            render['pricing'][0]['description'] = '\n'.join(n for n in [render['pricing'][0].get('description'), render['schedule']] if n)
        if render.get('materials'):
            material_row = next((row for row in render['pricing'] if row.get('title', '').casefold() == 'materials'), None)
            if material_row is None:
                material_row = {'title': 'Materials', 'amount': None, 'amount_label': ''}
                render['pricing'].append(material_row)
            material_row['description'] = '\n'.join(n for n in [material_row.get('description'), render['materials']] if n)
        for photo in render.get('photos', []):
            within(project, photo['path'])
        write_json(scratch/'render-data.json', render)
        pdf_name = data['slug']+'_Surfside_Proposal.pdf'
        subprocess.run([sys.executable, str(PACKAGE/'render_pdf.py'), '--project', str(project),
                        '--data', str(scratch/'render-data.json'), '--output', str(site/pdf_name)], check=True, stdout=subprocess.PIPE)
        converter = shutil.which('pdftoppm')
        if not converter:
            raise ValueError('Install Poppler (pdftoppm) so every PDF page can be rendered for review.')
        renders = scratch/'pdf-pages'
        renders.mkdir()
        subprocess.run([converter, '-png', '-r', '110', str(site/pdf_name), str(renders/'page')], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        shutil.copy2(sorted(renders.glob('page-*.png'))[0], site/'proposal-preview.png')
        before, before_count = gallery_cards(project, site, scratch, 'before')
        after, after_count = gallery_cards(project, site, scratch, 'after')
        web = data.get('web', {})
        hero = ''
        if web.get('hero_image'):
            photo = decoded_image(within(project, web['hero_image']), scratch)
            photo.thumbnail((1800, 1800))
            photo.save(site/'hero.webp', quality=88, method=6)
            hero = f'<figure class="hero-photo"><img src="./hero.webp" width="{photo.width}" height="{photo.height}" alt="{escape(web.get("hero_alt") or "Project residence at "+data["site_address"], quote=True)}" fetchpriority="high">'
            if web.get('hero_caption'):
                hero += '<figcaption class="hero-photo-note">'+escape(web['hero_caption'])+'</figcaption>'
            hero += '</figure>'
        text = lambda value: escape(str(value), quote=True)
        fields = {
            'PDF_FILENAME': text(pdf_name), 'PAGE_TITLE': text(data['project_name']+' | '+data['business_name']+' Proposal'),
            'DESCRIPTION': text('View and download the '+data['business_name']+' proposal for '+data['site_address']+'.'),
            'SITE_ADDRESS': text(data['site_address']), 'PROJECT_NAME': text(data['project_name']),
            'HERO': hero, 'BEFORE_PHOTOS': before, 'AFTER_PHOTOS': after,
            'PHOTO_COUNT': str(before_count)+' '+('photo' if before_count == 1 else 'photos'),
            'COUNT_HIDDEN': '' if before_count else ' hidden',
            'BEFORE_EMPTY_HIDDEN': ' hidden' if before_count else '', 'AFTER_EMPTY_HIDDEN': ' hidden' if after_count else '',
            'DRAFT_BANNER': '' if final else '<p class="draft-banner">Draft proposal - pending review and approval.</p>',
        }
        html = (site/'index.html').read_text()
        for key, value in fields.items():
            html = html.replace('@@'+key+'@@', value)
        html = html.replace('<h1 id="hero-title">Surfside Paint</h1>', '<h1 id="hero-title">'+text(web.get('title') or 'Surfside Paint')+'</h1>')
        if not hero:
            html = html.replace('class="hero"', 'class="hero hero-without-photo"')
        (site/'index.html').write_text(html)
        write_json(site/'proposal-project.json', {'project_id': data['project_id'], 'slug': data['slug'], 'template_version': VERSION})
        pages = check_site(site)
        report = {'project_id': data['project_id'], 'slug': data['slug'], 'template_version': VERSION,
                  'status': 'final' if final else 'draft', 'source_sha256': source_hash,
                  'built_at': datetime.now(ZoneInfo('America/Los_Angeles')).isoformat(), 'pdf_pages': pages,
                  'before_photos': before_count, 'after_photos': after_count, 'missing_fields': missing,
                  'files': content_hashes(site)}
        for name, source in [('site', site), ('pdf-pages', renders)]:
            target = output/name
            if target.is_symlink():
                raise ValueError('Build output cannot be a symbolic link.')
            if target.exists():
                shutil.rmtree(target)
            shutil.move(str(source), target)
        write_json(output/'build.json', report)
        return output/'site', report
    finally:
        shutil.rmtree(scratch)


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
    new.add_argument('address'); new.add_argument('--slug'); new.add_argument('--projects-dir', type=Path)
    for name in ['intake', 'build', 'stage', 'serve', 'check']:
        command = commands.add_parser(name)
        command.add_argument('project', type=Path)
        if name == 'build':
            command.add_argument('--final', action='store_true')
        elif name == 'stage':
            command.add_argument('--repo', type=Path, default=None)
        elif name == 'serve':
            command.add_argument('--port', type=int, default=4174)
    args = parser.parse_args()
    try:
        if args.command == 'new':
            project = create_project(args.address, args.slug, args.projects_dir)
            print(project)
            print('Next: provide photos and complete proposal-details.json. Run intake to see missing items.')
        elif args.command == 'intake':
            _, data = load_project(args.project)
            print('\n'.join('- '+item for item in missing_fields(data)) or 'Intake complete. Build and review the final proposal.')
        elif args.command == 'build':
            site, report = build_project(args.project, args.final)
            print(site)
            print(f'{report["status"].title()}: {report["pdf_pages"]} PDF page(s), {report["before_photos"]} Before, {report["after_photos"]} After photos.')
            print('Inspect every rendered PDF page in output/pdf-pages before submission or publication.')
        elif args.command == 'stage':
            print(stage_project(args.project, args.repo or repo_root()))
            print('Staged only. Review the diff and obtain publication approval before pushing main.')
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
