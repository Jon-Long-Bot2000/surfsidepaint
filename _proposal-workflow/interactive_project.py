"""Approved v2 interactive proposals. Private editor inputs never enter public output."""
import base64
import copy
from datetime import datetime
import hashlib
from html import escape
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from uuid import uuid4
from zoneinfo import ZoneInfo

PACKAGE=Path(__file__).resolve().parent
VERSION=(PACKAGE/'VERSION').read_text().strip()
OPTIONAL={'prepared_for.company','prepared_for.contact','prepared_for.address','prepared_for.phone','prepared_for.email','summary','web.hero_image'}

def read(path):return json.loads(Path(path).read_text())
def write(path,value):Path(path).write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n')
def slugify(address):
    import unicodedata
    street=unicodedata.normalize('NFKD',address.split(',')[0]).encode('ascii','ignore').decode().lower()
    value=re.sub('[^a-z0-9]+','-',street).strip('-')
    if not value or len(value)>100:raise ValueError('Provide a street address that can form a URL name.')
    return value

def create(address,slug=None,projects_dir=None):
    from proposal import repo_root,safe_slug
    if not address.strip():raise ValueError('Provide the project address.')
    slug=safe_slug(slug) if slug else slugify(address)
    repo=repo_root();base=Path(projects_dir).resolve() if projects_dir else repo/'_proposal-projects'
    if any(p.name.casefold()==slug.casefold() for p in repo.iterdir()) or (base.exists() and any(p.name.casefold()==slug.casefold() for p in base.iterdir())):
        raise ValueError('That source folder or public URL already exists. Revise the existing project instead.')
    project=base/slug;project.mkdir(parents=True)
    for folder in ['assets/hero','assets/contractor','output','tmp']:(project/folder).mkdir(parents=True)
    defaults=read(PACKAGE/'defaults.json')
    data={'project_id':uuid4().hex,'template_version':VERSION,'slug':slug,'branch':'codex/proposal-'+slug.lower(),
          'businessName':defaults['business_name'],'preparedBy':defaults['prepared_by'],
          'street':address.split(',')[0].strip(),'address':address,'date':datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%B %d, %Y').replace(' 0',' '),
          'company':'','client':'','contactAddress':'','email':'','phone':'','website':'','contractorLogo':'',
          'summary':'','packageLabel':'','finishes':[{'id':uuid4().hex,'title':'','price':None,'priceType':'contract','priceLabel':'','note':'','scope':''}],
          'additions':[],'priceNote':'','materials':'','schedule':'','exclusions':'','terms':defaults['terms_default'],'termsDefaultInitialized':True,
          'heroPhotos':[],'primaryHeroId':'','heroImage':'','selectedExtras':[], 'preview':True,
          'pricing_confirmed':False,'terms_confirmed':False,'omitted_fields':[]}
    write(project/'proposal-details.json',data)
    (project/'INTAKE.md').write_text((PACKAGE/'INTAKE.md').read_text())
    (project/'.gitignore').write_text('*\n!.gitignore\n')
    shutil.copytree(PACKAGE,project/'_template',ignore=shutil.ignore_patterns('__pycache__','*.pyc','tmp','tests','.openai'))
    return project

def validate(data):
    if data.get('template_version')!=VERSION:raise ValueError('Use this project’s matching _template snapshot.')
    if not re.fullmatch('[a-f0-9]{32}',data.get('project_id','')):raise ValueError('Invalid project identifier.')
    from proposal import safe_slug
    safe_slug(data['slug'])
    for key in ['street','address','date','company','client','contactAddress','email','phone','website','summary','packageLabel','priceNote','materials','schedule','exclusions','terms','contractorLogo']:
        if not isinstance(data.get(key),str):raise ValueError(key+' must be plain text.')
    datetime.strptime(data['date'],'%B %d, %Y')
    ids=set()
    if not data.get('finishes'):raise ValueError('Keep at least one scope option.')
    for key in ['finishes','additions']:
        if not isinstance(data.get(key),list):raise ValueError(key+' must be a list.')
        for item in data[key]:
            if not isinstance(item,dict) or not re.fullmatch('[A-Za-z0-9-]{1,100}',item.get('id','')) or item['id'] in ids:raise ValueError('Each option needs a unique identifier.')
            ids.add(item['id'])
            for field in ['title','note','scope']:
                if not isinstance(item.get(field),str):raise ValueError('Option '+field+' must be text.')
            amount=item.get('price')
            if amount is not None and (isinstance(amount,bool) or not isinstance(amount,(int,float)) or not math.isfinite(amount) or amount<0):raise ValueError('Prices must be nonnegative numbers or blank.')
            if item.get('priceType') not in ['contract','labor','materials','labor-materials','other']:raise ValueError('Choose a supported price type.')
            if not isinstance(item.get('priceLabel',''),str):raise ValueError('Custom price labels must be text.')
    if not isinstance(data.get('omitted_fields'),list) or any(key not in OPTIONAL for key in data['omitted_fields']):raise ValueError('Invalid field omission. Approval flags cannot be omitted.')
    photos=data.get('heroPhotos')
    if not isinstance(photos,list):raise ValueError('Hero photos must be a list.')
    if photos and data.get('primaryHeroId') not in [p.get('id') for p in photos]:raise ValueError('Choose a primary hero photo.')
    for photo in photos:
        if not isinstance(photo,dict) or not all(isinstance(photo.get(k,''),str) for k in ['id','src','name','caption']):raise ValueError('Invalid hero photo.')
    if not isinstance(data.get('preparedBy'),dict) or not isinstance(data['preparedBy'].get('address'),list):raise ValueError('Prepared By defaults are missing.')

def missing(data):
    omitted=set(data.get('omitted_fields',[]));result=[]
    for key,value in [('prepared_for.company',data['company']),('prepared_for.contact',data['client']),('prepared_for.address',data['contactAddress']),('prepared_for.email',data['email']),('prepared_for.phone',data['phone']),('summary',data['summary']),('web.hero_image',data.get('heroPhotos'))]:
        if not value and key not in omitted:result.append('Provide or explicitly omit '+key)
    if not data['street'].strip() or not data['address'].strip():result.append('Full project-site address')
    for item in data['finishes']+data['additions']:
        if not item['title'].strip() or not item['scope'].strip() or item.get('price') is None:result.append('Complete the title, scope and price for each available option/extra')
        if item.get('priceType')=='other' and not item.get('priceLabel','').strip():result.append('Custom price label for Other')
    if data.get('pricing_confirmed') is not True:result.append('Pricing and materials arrangements approved [pricing_confirmed]')
    if data.get('terms_confirmed') is not True:result.append('Terms or their explicit absence approved [terms_confirmed]')
    return list(dict.fromkeys(result))

def asset(project,relative):
    path=Path(relative)
    resolved=(project/path).resolve()
    if path.is_absolute() or not resolved.is_relative_to((project/'assets').resolve()) or not resolved.is_file() or resolved.is_symlink():raise ValueError('Assets must be existing files inside this project’s assets folder.')
    return resolved

def import_image(project,value,folder):
    if not value:return ''
    if not value.startswith('data:'):
        asset(project,value);return value
    match=re.fullmatch(r'data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)',value)
    if not match:raise ValueError('Use PNG, JPG or WebP images.')
    raw=base64.b64decode(match[2],validate=True)
    if len(raw)>12_000_000:raise ValueError('An image is too large to save.')
    from PIL import Image
    import io
    with Image.open(io.BytesIO(raw)) as image:
        if image.width*image.height>40_000_000:raise ValueError('Image dimensions are too large.')
        image.verify()
    ext={'png':'png','jpeg':'jpg','webp':'webp'}[match[1]]
    relative=f'assets/{folder}/{hashlib.sha256(raw).hexdigest()[:24]}.{ext}'
    path=project/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
    return relative

def save_editor(project,candidate):
    saved=read(project/'proposal-details.json')
    data=copy.deepcopy(candidate)
    # Input cannot change project identity, route, saved business defaults or approval flags.
    for key in ['project_id','template_version','slug','branch','businessName','preparedBy','omitted_fields','selectedExtras']:
        data[key]=saved[key]
    data['preview']=True;data['pricing_confirmed']=False;data['terms_confirmed']=False
    data['photos']={'before':[],'after':[]} if 'photos' in data else None
    data.pop('photos',None)
    for photo in data.get('heroPhotos',[]):photo['src']=import_image(project,photo['src'],'hero')
    data['contractorLogo']=import_image(project,data.get('contractorLogo',''),'contractor')
    data['heroImage']=''
    validate(data)
    temporary=project/'tmp/proposal-details-saving.json';write(temporary,data);temporary.replace(project/'proposal-details.json')
    return data

def editor_data(project):
    data=read(project/'proposal-details.json');validate(data)
    def inline(relative):
        if not relative:return ''
        path=asset(project,relative);kind={'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp'}.get(path.suffix.lower())
        if not kind:raise ValueError('Use PNG, JPG or WebP images in the editor.')
        return 'data:image/'+kind+';base64,'+base64.b64encode(path.read_bytes()).decode()
    for photo in data['heroPhotos']:photo['src']=inline(photo['src'])
    data['contractorLogo']=inline(data['contractorLogo'])
    return data

def write_site(project,data,site,final=False):
    from PIL import Image,ImageOps
    from proposal import within
    if site.exists():shutil.rmtree(site)
    shutil.copytree(PACKAGE/'template/site',site)
    public={key:copy.deepcopy(data[key]) for key in ['slug','businessName','preparedBy','street','address','date','company','client','contactAddress','email','phone','summary','packageLabel','finishes','additions','priceNote','materials','schedule','exclusions','terms','selectedExtras']}
    public.update(preview=not final,heroPhotos=[],primaryHeroId=data.get('primaryHeroId',''),heroImage='',contractorLogo='')
    for photo in data['heroPhotos']:
        source=asset(project,photo['src']);name='hero-'+hashlib.sha256(source.read_bytes()).hexdigest()[:24]+'.webp'
        (site/'images').mkdir(exist_ok=True)
        with Image.open(source) as original:
            image=ImageOps.exif_transpose(original).convert('RGB');image.thumbnail((1800,1800));image.save(site/'images'/name,quality=88,method=6)
        public['heroPhotos'].append({**photo,'src':'./images/'+name})
    if data['contractorLogo']:
        source=asset(project,data['contractorLogo']);(site/'images').mkdir(exist_ok=True)
        with Image.open(source) as original:
            image=ImageOps.exif_transpose(original).convert('RGBA');image.thumbnail((600,240));image.save(site/'images/contractor-logo.png')
        public['contractorLogo']='./images/contractor-logo.png'
    payload=json.dumps(public,ensure_ascii=True,allow_nan=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    js=(site/'data.mjs').read_text().replace('@@PUBLIC_DATA@@',payload)
    (site/'data.mjs').write_text(js)
    html=(site/'index.html').read_text()
    for key,value in {'PAGE_TITLE':escape(data['street']+' | '+data['businessName']+' Proposal'),'PDF_FILENAME':escape(data['slug']+'_Surfside_Proposal.pdf'),'DRAFT_BANNER':'' if final else '<p class="draft-banner">Draft proposal — pending review and approval.</p>'}.items():html=html.replace('@@'+key+'@@',value)
    (site/'index.html').write_text(html)
    write(site/'proposal-project.json',{'project_id':data['project_id'],'slug':data['slug'],'template_version':VERSION})
    return public

def check_site(site):
    from proposal import AssetCheck
    for name in ['index.html','data.mjs','app.mjs','pdf.mjs','paint-house.png']:
        if not (site/name).is_file():raise ValueError('Missing interactive site asset: '+name)
    html=(site/'index.html').read_text();AssetCheck(site).feed(html)
    if '@@' in html or '@@PUBLIC_DATA@@' in (site/'data.mjs').read_text():raise ValueError('Unresolved template content.')
    if (site/'editor.html').exists() or (site/'draft-store.mjs').exists() or (site/'editor_server.py').exists():raise ValueError('Private editor files cannot be staged.')
    if 'photo-dialog' in html or 'gallery.mjs' in html or 'class="gallery"' in html:raise ValueError('The approved template has no Photo Gallery.')
    from pypdf import PdfReader
    pdf=next(site.glob('*_Surfside_Proposal.pdf'));reader=PdfReader(pdf)
    if not reader.pages or not all(page.extract_text().strip() for page in reader.pages):raise ValueError('The PDF has an empty page.')
    return len(reader.pages)

def build(project,final=False):
    from proposal import load_project,fingerprint,content_hashes
    project,data=load_project(project);issues=missing(data)
    if final and issues:raise ValueError('Complete intake before final build:\n- '+'\n- '.join(issues))
    node=shutil.which('node');converter=shutil.which('pdftoppm')
    if not node or not converter:raise ValueError('Node.js and Poppler pdftoppm are required to build the PDF and review pages.')
    output=project/'output';output.mkdir(exist_ok=True)
    scratch=Path(tempfile.mkdtemp(prefix='interactive-build-',dir=project/'tmp'))
    try:
        site=scratch/'site';write_site(project,data,site,final)
        subprocess.run([node,str(PACKAGE/'export_pdf.mjs'),str(site),data['slug']+'_Surfside_Proposal.pdf'],check=True,capture_output=True)
        renders=scratch/'pdf-pages';renders.mkdir()
        subprocess.run([converter,'-png','-r','110',str(site/(data['slug']+'_Surfside_Proposal.pdf')),str(renders/'page')],check=True,capture_output=True)
        pages=check_site(site)
        report={'project_id':data['project_id'],'slug':data['slug'],'template_version':VERSION,'status':'final' if final else 'draft','source_sha256':fingerprint(project),'built_at':datetime.now(ZoneInfo('America/Los_Angeles')).isoformat(),'pdf_pages':pages,'missing_fields':issues,'files':content_hashes(site)}
        for name,path in [('site',site),('pdf-pages',renders)]:
            target=output/name
            if target.is_symlink():raise ValueError('Build output cannot be a symbolic link.')
            if target.exists():shutil.rmtree(target)
            shutil.move(str(path),target)
        write(output/'build.json',report)
        return output/'site',report
    finally:shutil.rmtree(scratch)
