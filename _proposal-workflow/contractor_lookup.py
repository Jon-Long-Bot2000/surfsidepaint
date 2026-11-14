"""Temporary, loopback-only proposal editor and public website lookup."""
import base64
import ipaddress
import json
import re
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOWED_ORIGINS = {f'http://{host}:{port}' for host in ('localhost', '127.0.0.1') for port in (4174, 4175)}
SLOTS = threading.BoundedSemaphore(2)

def public_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Enter a public http or https website address.')
    if parsed.port not in (None, 80, 443):
        raise ValueError('Only standard website ports are supported.')
    addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == 'https' else 80), type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(address[4][0]).is_global for address in addresses):
        raise ValueError('Only public websites can be looked up.')
    return url

class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url, limit=2_000_000):
    public_url(url)
    request = urllib.request.Request(url, headers={'User-Agent': 'SurfsideProposalEditor/0.1 (contact details lookup)', 'Accept': 'text/html,application/json,image/*;q=0.8'})
    with urllib.request.build_opener(PublicRedirect).open(request, timeout=8) as response:
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError('This page or image is too large to import.')
        return data, response.headers.get_content_type(), response.geturl(), response.headers.get_content_charset() or 'utf-8'

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.images, self.structured, self.text = {}, [], [], [], []
        self.script = None
        self.script_text = []
        self.title = ''
        self.in_title = False
        self.ignore = 0
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name', '')).lower()] = attrs.get('content', '')
        elif tag == 'a':
            self.links.append(attrs.get('href', ''))
        elif tag == 'img':
            self.images.append(attrs)
        elif tag == 'script':
            self.script = attrs.get('type', '')
            self.script_text = []
        elif tag == 'title':
            self.in_title = True
        elif tag == 'style':
            self.ignore += 1
    def handle_endtag(self, tag):
        if tag == 'script':
            if self.script == 'application/ld+json':
                try:
                    self.structured.append(json.loads(''.join(self.script_text)))
                except (ValueError, TypeError):
                    pass
            self.script = None
        elif tag == 'title':
            self.in_title = False
        elif tag == 'style':
            self.ignore = max(0, self.ignore - 1)
    def handle_data(self, text):
        if self.script is not None:
            self.script_text.append(text)
        elif not self.ignore:
            if self.in_title:
                self.title += text
            self.text.append(text)

def nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            if isinstance(child, (dict, list)):
                yield from nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from nodes(child)

def clean(value):
    return re.sub(r'\s+', ' ', value).strip()[:500] if isinstance(value, str) else ''

def lookup(url):
    if not urllib.parse.urlsplit(url).scheme:
        url = 'https://' + url
    body, kind, final, encoding = fetch(url)
    if kind not in ('text/html', 'application/xhtml+xml'):
        raise ValueError('Enter the company website, rather than a document or image URL.')
    pages = [(final, Page(body.decode(encoding, errors='replace')))]
    home = pages[0][1]
    # Follow one contact page on the same website; do not crawl unrelated domains.
    contact = next((urllib.parse.urljoin(final, href) for href in home.links if re.search(r'(?:^|/)contact(?:[-/_.]|$)', urllib.parse.urlsplit(href).path, re.I) and urllib.parse.urlsplit(urllib.parse.urljoin(final, href)).netloc == urllib.parse.urlsplit(final).netloc), None)
    if contact and contact.rstrip('/') != final.rstrip('/'):
        try:
            data, kind, dest, enc = fetch(contact)
            if kind in ('text/html', 'application/xhtml+xml'):
                pages.append((dest, Page(data.decode(enc, errors='replace'))))
        except Exception:
            pass
    details = {'company': '', 'client': '', 'contactAddress': '', 'email': '', 'phone': ''}
    sources = {}
    logo_url = ''
    def add(key, value, source):
        value = clean(value)
        if value and not details[key]:
            details[key], sources[key] = value, source
    for source, page in pages:
        for root in page.structured:
            for entity in nodes(root):
                types = entity.get('@type', [])
                types = [types] if isinstance(types, str) else types
                business = any(re.search(r'Organization|Business|Contractor|ProfessionalService|Corporation|Store', str(t), re.I) for t in types)
                if not business:
                    continue
                add('company', entity.get('name'), source)
                add('phone', entity.get('telephone'), source)
                add('email', str(entity.get('email', '')).removeprefix('mailto:'), source)
                address = entity.get('address')
                if isinstance(address, dict):
                    address = ', '.join(filter(None, [clean(address.get('streetAddress')), clean(address.get('addressLocality')), ' '.join(filter(None, [clean(address.get('addressRegion')), clean(address.get('postalCode'))]))]))
                add('contactAddress', address, source)
                contact_person = entity.get('contactPoint')
                if isinstance(contact_person, list):
                    contact_person = next((x for x in contact_person if isinstance(x, dict)), {})
                if isinstance(contact_person, dict):
                    add('phone', contact_person.get('telephone'), source)
                    add('email', contact_person.get('email'), source)
                    add('client', contact_person.get('name'), source)
                logo = entity.get('logo')
                if isinstance(logo, dict):
                    logo = logo.get('contentUrl') or logo.get('url')
                if isinstance(logo, str) and not logo_url:
                    logo_url = urllib.parse.urljoin(source, logo)
        for href in page.links:
            if href.lower().startswith('mailto:'):
                add('email', urllib.parse.unquote(href[7:].split('?')[0]), source)
            if href.lower().startswith('tel:'):
                add('phone', urllib.parse.unquote(href[4:].split('?')[0]), source)
    add('company', home.meta.get('og:site_name'), final)
    if not logo_url:
        logo_image = next((img for img in home.images if 'logo' in (img.get('alt', '')+' '+img.get('class', '')+' '+img.get('src', '')).lower()), {})
        src = logo_image.get('src') or logo_image.get('data-src')
        if src:
            logo_url = urllib.parse.urljoin(final, src)
    logo_data, warning = '', ''
    if logo_url:
        try:
            data, kind, logo_url, _ = fetch(logo_url, 3_000_000)
            if kind in ('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'):
                logo_data = f'data:{kind};base64,' + base64.b64encode(data).decode('ascii')
            else:
                warning = 'The website logo format could not be imported. You can upload it manually.'
        except Exception:
            warning = 'The website logo could not be imported. You can upload it manually.'
    return {'details': details, 'sources': sources, 'website': final, 'pages': [source for source, _ in pages], 'logo': logo_data, 'logoSource': logo_url if logo_data else '', 'warning': warning}

