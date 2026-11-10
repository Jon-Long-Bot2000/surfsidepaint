"""Serve the webpage and a shared, persistent local photo gallery on the LAN."""
import argparse
from datetime import datetime, timezone
from email import policy
from email.parser import BytesParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
from pathlib import Path
import re
import threading
from urllib.parse import unquote, urlsplit
from uuid import uuid4
import warnings

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MAX_BODY = 8 * 1024 * 1024
LOCK = threading.Lock()


def read_jpeg(data, limit):
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(BytesIO(data)) as raw:
            if raw.format != 'JPEG' or max(raw.size) > limit or min(raw.size) < 1:
                raise ValueError('Please choose a valid photo.')
            return ImageOps.exif_transpose(raw).convert('RGB')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, value, status=200):
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def public_photo(self, record):
        base = f'http://{self.headers.get("Host")}/api/gallery/photos/{record["id"]}'
        return dict(record, url=base+'.jpg', thumbnailUrl=base+'-thumb.jpg')

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/gallery-config.json':
            self.json_response({'apiBase': '/api/gallery'})
            return
        if path == '/api/gallery':
            with LOCK:
                records = [json.loads(p.read_text()) for p in self.server.storage.glob('*.json')]
            records.sort(key=lambda p: (p['createdAt'], p['id']))
            self.json_response({'photos': [self.public_photo(p) for p in records], 'nextCursor': None})
            return
        if path.startswith('/api/gallery/photos/'):
            name = path.rsplit('/', 1)[-1]
            if not re.fullmatch(r'[a-f0-9]{32}(?:-thumb)?\.jpg', name):
                self.json_response({'error': 'Photo not found.'}, 404)
                return
            photo = self.server.storage/name
            if not photo.is_file():
                self.json_response({'error': 'Photo not found.'}, 404)
                return
            data = photo.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(data)
            return
        if any(part.startswith('.') for part in path.split('/') if part):
            self.send_error(403)
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != '/api/gallery':
            self.json_response({'error': 'Not found.'}, 404)
            return
        origin = self.headers.get('Origin')
        if origin and origin != f'http://{self.headers.get("Host")}':
            self.json_response({'error': 'Upload from the project page.'}, 403)
            return
        validated = False
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                self.json_response({'error': 'Photo is too large.'}, 413)
                return
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data;'):
                raise ValueError('Please choose a photo to upload.')
            body = self.rfile.read(length)
            message = BytesParser(policy=policy.default).parsebytes(
                b'Content-Type: '+content_type.encode()+b'\r\nMIME-Version: 1.0\r\n\r\n'+body)
            fields = {part.get_param('name', header='content-disposition'): part.get_payload(decode=True)
                      for part in message.iter_parts()}
            stage = fields.get('stage', b'').decode()
            if stage not in ('before', 'after'):
                raise ValueError('Choose Before or After.')
            photo = read_jpeg(fields.get('photo', b''), 1800)
            thumbnail = read_jpeg(fields.get('thumbnail', b''), 640)
            validated = True
            identifier = uuid4().hex
            record = {'id': identifier, 'stage': stage, 'width': photo.width, 'height': photo.height,
                      'createdAt': datetime.now(timezone.utc).isoformat()}
            with LOCK:
                photo.save(self.server.storage/(identifier+'.jpg'), quality=86)
                thumbnail.save(self.server.storage/(identifier+'-thumb.jpg'), quality=78)
                temporary = self.server.storage/(identifier+'.json.tmp')
                temporary.write_text(json.dumps(record))
                temporary.replace(self.server.storage/(identifier+'.json'))
            self.json_response({'photo': self.public_photo(record)}, 201)
        except (ValueError, OSError, UnicodeError, Image.DecompressionBombWarning) as error:
            if validated:
                self.json_response({'error': 'This photo could not be saved. Please try again.'}, 503)
            else:
                self.json_response({'error': str(error) if isinstance(error, ValueError) else 'This photo could not be opened. Please choose a JPG, PNG, or WebP image.'}, 400)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4173)
    parser.add_argument('--storage', type=Path, default=ROOT/'.gallery-data')
    args = parser.parse_args()
    args.storage.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('0.0.0.0', args.port), Handler)
    server.storage = args.storage.resolve()
    print(f'Shared gallery preview: http://localhost:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
