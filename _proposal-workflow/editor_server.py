"""Loopback-only, project-scoped editor. Never commits, branches, stages or deploys."""
import json
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import threading
from urllib.parse import urlsplit,parse_qs,unquote
from contractor_lookup import lookup,SLOTS
from interactive_project import editor_data,save_editor,write_site

PACKAGE=Path(__file__).resolve().parent

def serve_editor(project,port):
    from proposal import load_project
    project,data=load_project(project)
    preview=project/'output/editor-preview'
    write_site(project,data,preview)
    lock=threading.Lock()
    origins={f'http://localhost:{port}',f'http://127.0.0.1:{port}'}
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self,format,*args):
            # Contact lookups contain website query strings; do not record these.
            if not self.path.startswith('/api/'):super().log_message(format,*args)
        def authorized(self):
            return self.headers.get('Host') in {f'localhost:{port}',f'127.0.0.1:{port}'} and (not self.headers.get('Origin') or self.headers.get('Origin') in origins)
        def reply(self,status,value):
            raw=json.dumps(value,allow_nan=False).encode()
            self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
        def do_GET(self):
            if not self.authorized():return self.send_error(403)
            path=urlsplit(self.path).path
            if path=='/api/draft':
                try:
                    with lock:result=editor_data(project)
                    return self.reply(200,result)
                except (ValueError,OSError,KeyError) as error:return self.reply(400,{'error':str(error)})
            if path=='/api/contractor':
                if not SLOTS.acquire(blocking=False):return self.reply(429,{'error':'Another lookup is running. Try again shortly.'})
                try:
                    website=parse_qs(urlsplit(self.path).query).get('url',[''])[0].strip()
                    if not website or len(website)>2000:raise ValueError('Enter the contractor website.')
                    return self.reply(200,lookup(website))
                except ValueError as error:return self.reply(400,{'error':str(error)})
                except Exception:return self.reply(502,{'error':'The website could not be read. Enter the details and logo manually.'})
                finally:SLOTS.release()
            return super().do_GET()
        def do_POST(self):
            if not self.authorized() or urlsplit(self.path).path!='/api/draft':return self.send_error(403)
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=64_000_000:raise ValueError('The draft is too large. Use fewer or smaller images.')
                if self.headers.get_content_type()!='application/json':raise ValueError('Expected JSON project data.')
                candidate=json.loads(self.rfile.read(length))
                with lock:
                    saved=save_editor(project,candidate)
                    write_site(project,saved,preview)
                return self.reply(200,{'saved':True,'project_id':saved['project_id'],'slug':saved['slug']})
            except (ValueError,OSError,KeyError,TypeError) as error:return self.reply(400,{'error':str(error)})
        def translate_path(self,path):
            clean=unquote(urlsplit(path).path)
            if clean.startswith('/preview/'):
                relative=clean[len('/preview/'):];root=preview
            elif clean in ['','/']:
                relative='editor.html';root=PACKAGE/'template/editor'
            elif clean=='/paint-house.png':
                relative='paint-house.png';root=PACKAGE/'template/site'
            else:
                relative=clean.lstrip('/');root=PACKAGE/'template/editor'
            target=(root/relative).resolve()
            if not target.is_relative_to(root.resolve()):return str(PACKAGE/'not-found')
            return str(target)
        def list_directory(self,path):return self.send_error(404)
        def end_headers(self):
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            super().end_headers()
    print(f'Project editor (this computer): http://localhost:{port}/editor.html',flush=True)
    print(f'Visitor preview: http://localhost:{port}/preview/',flush=True)
    print('Private editor on loopback only. No commit, deployment, cloud service or project creation action is exposed.',flush=True)
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
