from pathlib import Path
from html import escape
import shutil
root=Path(__file__).resolve().parent
I='#183e47';G='#146657';B='#f6f3e7';S='#dfe9da';L='#c7d8ca';M='#789889';W='#fff'
FONT="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
def text(x,y,value,size=10,fill=I,weight=600,anchor='middle',spacing=0):
 return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}" letter-spacing="{spacing}">{escape(value)}</text>'
def price(x,y,size=44,month=17):
 return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="650" fill="{I}" text-anchor="middle" letter-spacing="-1.8">$150<tspan dx="6" font-size="{month}" font-weight="500" letter-spacing="0">/month</tspan></text>'
def label(x,y):return text(x,y,'BILLED AT',9.5,I,650,spacing=1.1)
def backing():return f'<ellipse cx="178" cy="243" rx="118" ry="10" fill="{I}" opacity=".06"/><rect x="48" y="35" width="250" height="202" rx="18" fill="{S}"/>'
def rect(x,y,w,h,fill=B,stroke=I,sw=3,r=12):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def line(x,y,w,color=L,sw=1.5):return f'<path d="M{x} {y}h{w}" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
# P1 — broad oval seal: generous breathing room, two fine green rings.
a=backing()+f'<ellipse cx="180" cy="139" rx="130" ry="81" fill="{I}" opacity=".035"/><ellipse cx="178" cy="133" rx="130" ry="81" fill="{B}" stroke="{G}" stroke-width="1.6"/><ellipse cx="178" cy="133" rx="119" ry="70" fill="none" stroke="{G}" stroke-width=".9"/>'
a+=text(178,85,'SURFSIDE',8,G,700,spacing=1.7)+label(178,112)+price(178,158,43,17)+text(178,185,'HOME SERVICES',7.5,G,600,spacing=1.5)
a+=f'<path d="M76 124v18m204-18v18" stroke="{G}" stroke-width=".7" opacity=".6"/>'
# P2 — printed membership pass: card stock, offset edge, understated printed detail.
b=backing()+'<g transform="rotate(-4 177 135)">'+rect(48,56,266,169,S,I,1.7,14)+rect(44,50,266,169,B,I,3.5,14)
b+=f'<path d="M60 50h8v169h-8a16 16 0 0 1-16-16V66a16 16 0 0 1 16-16Z" fill="{G}"/>'
b+=text(184,78,'SURFSIDE HOME SERVICES',8.5,G,700,spacing=1)+line(87,88,197,L,1)
b+=label(184,115)+price(184,163,45,17)+text(184,191,'MEMBERSHIP',8.5,G,650,spacing=1.9)
b+=f'<circle cx="91" cy="191" r="2" fill="{G}"/><circle cx="277" cy="191" r="2" fill="{G}"/></g>'
# P3 — the pass tucked into a sleeve: a tangible, everyday membership object.
c=backing()+'<g transform="rotate(4 181 132)">'+rect(62,39,240,170,B,I,3,13)
c+=text(182,66,'SURFSIDE HOME SERVICES',8,G,650,spacing=.9)+label(182,94)+price(182,140,43,17)
c+=line(88,156,185,L,1.5)+'</g>'
c+=f'<path d="M60 164h94q24 27 48 0h95a15 15 0 0 1 15 15v40a15 15 0 0 1-15 15H60a15 15 0 0 1-15-15v-40a15 15 0 0 1 15-15Z" fill="#c7d8ca" stroke="{I}" stroke-width="3" stroke-linejoin="round"/>'
c+=f'<path d="M56 184v35a5 5 0 0 0 5 5h235a5 5 0 0 0 5-5v-35" fill="none" stroke="{G}" stroke-width="1" stroke-dasharray="3 4"/>'+text(178,206,'SURFSIDE',11,G,700,spacing=1.8)+text(178,220,'HOME SERVICES',6.5,G,600,spacing=1.2)
# P4 — clipped member badge: a paper pass and an integrated clip, like M1's checklist.
d=backing()+'<g transform="rotate(-3 180 135)">'+rect(65,49,230,183,B,I,3.5,14)
d+=rect(139,29,82,30,M,I,2.5,5)+rect(153,38,54,9,B,'none',0,3)
d+=label(180,99)+price(180,149,44,17)+line(94,167,172,L,1.5)
d+=text(180,193,'SURFSIDE',12,G,700,spacing=1.6)+text(180,209,'HOME SERVICES',7.5,G,600,spacing=1.5)
d+=f'<circle cx="83" cy="66" r="2" fill="{M}"/><circle cx="277" cy="66" r="2" fill="{M}"/></g>'
# P5 — small membership folio, with a dark cover and a clean price page.
e=backing()+'<g transform="rotate(3 180 135)">'+rect(46,60,267,170,W,I,2.7,10)
e+=f'<path d="M60 55h83v170H60a14 14 0 0 1-14-14V69a14 14 0 0 1 14-14Z" fill="{G}" stroke="{I}" stroke-width="2.7"/>'+rect(143,55,170,170,B,I,2.7,9)
e+=f'<path d="M136 64v151m10-151v151" stroke="{M}" stroke-width="1.2"/>'
e+=text(94,103,'SURFSIDE',8.7,B,700,spacing=.7)+text(94,116,'HOME SERVICES',5.2,B,600,spacing=.6)
e+=f'<rect x="68" y="138" width="52" height="44" rx="4" fill="none" stroke="{B}" stroke-width="1" opacity=".7"/><path d="m78 158 16-12 16 12v15H78Z" fill="none" stroke="{B}" stroke-width="1.8" stroke-linejoin="round"/><path d="M91 173v-11h7v11" fill="none" stroke="{B}" stroke-width="1.5"/>'
e+=label(229,105)+price(229,153,37,14)+line(164,177,128,L,1.2)+text(229,199,'MEMBERSHIP',7.8,G,650,spacing=1.4)+'</g>'
# P6 — a physical membership ticket, with small edge notches and a printed stub.
f=backing()+'<g transform="rotate(4 180 135)">'
f+=f'<path d="M58 58H299a13 13 0 0 1 13 13v49a12 12 0 0 0 0 24v49a13 13 0 0 1-13 13H58a13 13 0 0 1-13-13v-49a12 12 0 0 0 0-24V71a13 13 0 0 1 13-13Z" fill="{B}" stroke="{I}" stroke-width="3"/>'
f+=f'<path d="M264 69v126" stroke="{G}" stroke-width="1.1" stroke-dasharray="3 4"/>'+text(160,84,'SURFSIDE HOME SERVICES',7.4,G,650,spacing=.6)+label(160,112)+price(160,155,40,16)+text(160,184,'MEMBERSHIP',7.8,G,650,spacing=1.5)
f+=f'<g transform="rotate(90 287 132)">{text(287,135,"HOME CARE",8,G,650,spacing=1.4)}</g><path d="M277 177v14m5-14v14m7-14v14m4-14v14" stroke="{M}" stroke-width="1.3"/></g>'
variants=[('Wide oval seal','The requested oval badge: two fine green rings, warm beige, dark teal type, and generous price spacing.',a),('Printed membership pass','A slightly tilted card with printed details, a slim green edge, and a second layer of card stock.',b),('Card in a sleeve','A membership pass tucked into a stitched sage sleeve, adding physical depth like H1 and M1.',c),('Clipped member badge','A clipped paper badge with restrained printed brand details and a clear inline price.',d),('Membership folio','A small open folio with a dark green cover and a cream price page.',e),('Membership ticket','A gently tilted pass with notched edges, a perforated stub, and small printed details.',f)]
for n,(title,note,body) in enumerate(variants,1):
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="270" viewBox="0 0 360 270" role="img" aria-labelledby="title desc"><title id="title">P{n} — {escape(title)}</title><desc id="desc">{escape(note)} Billed at $150 per month.</desc>{body}</svg>'
 (root/'svg'/f'membership-illustration-{n:02d}.svg').write_text(svg)
# Preserve the discarded whole-card study for reference; never alter benefits or Homes.
backup=root/'membership-cards-with-benefits.html'
if not backup.exists():shutil.copyfile(root/'price-simple.html',backup)
style='''*{box-sizing:border-box}body{margin:0;background:#f4f7f4;color:#183e47;font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}main{width:min(1160px,calc(100% - 40px));margin:auto;padding:32px 0 60px}a{color:#146657;text-underline-offset:4px}.eyebrow{font-size:.68rem;letter-spacing:.13em;font-weight:700;color:#146657;margin:24px 0 12px}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.1;letter-spacing:-.05em;margin:0 0 18px;font-weight:650}header{max-width:760px;margin-bottom:32px}header p{color:#536d6b}.reference{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:660px;margin:0 auto 38px;padding:20px;background:#eaf0e7;border-radius:18px}.reference img{display:block;width:100%;height:auto}.reference figcaption{font-size:.8rem;font-weight:600;text-align:center;margin-top:5px}figure{margin:0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.study{min-width:0;background:#fff;border:1px solid #d5e1d9;border-radius:17px;overflow:hidden;scroll-margin-top:22px}.art{padding:10px 4px;background:#f0f4ed}.art img{display:block;width:100%;height:auto}.caption{padding:18px 20px;border-top:1px solid #e0e7dd}.tag{background:#e6eee2;color:#146657;border-radius:5px;padding:3px 7px;font-weight:750;font-size:.68rem}h2{font-size:1.08rem;line-height:1.3;letter-spacing:-.025em;margin:10px 0 7px;font-weight:650}.caption p{font-size:.82rem;color:#536d6b;line-height:1.5;margin:0 0 9px}.caption a{display:inline-flex;align-items:center;min-height:44px;font-size:.78rem}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}nav a{border:1px solid #c7d8ca;border-radius:22px;padding:8px 14px;text-decoration:none;font-size:.8rem}.note{margin-top:36px;border-top:1px solid #d5e1d9;padding-top:20px;font-size:.84rem;color:#536d6b}a:focus-visible{outline:3px solid #146657;outline-offset:4px}@media(max-width:1000px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){main{width:calc(100% - 24px);padding-top:22px}.grid{grid-template-columns:1fr;gap:22px}.reference{padding:10px;gap:8px}.reference figcaption{font-size:.7rem}.art{padding:10px 20px}.caption{padding:17px 22px}}
'''
items=[]
for n,(title,note,body) in enumerate(variants,1):
 name=f'membership-illustration-{n:02d}'
 items.append(f'<article class="study" id="p{n}"><div class="art"><img src="svg/{name}.svg" width="360" height="270" alt="{escape(title)} — billed at $150 per month"/></div><div class="caption"><span class="tag">P{n}</span><h2>{title}</h2><p>{note}</p><a href="svg/{name}.svg" target="_blank">Open SVG ↗</a></div></article>')
nav=''.join(f'<a href="#p{n}">P{n}</a>' for n in range(1,7))
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Membership illustrations · Surfside</title><style>{style}</style></head><body><main><header><a href="/homes/">← Back to Homes</a><p class="eyebrow">SURFSIDE · MEMBERSHIP ILLUSTRATIONS</p><h1>A third illustration.<br>Six directions.</h1><p>Standalone membership-card artwork, designed to sit alongside the camera and calendar. Compare the shape, detail, and visual weight.</p><nav aria-label="Six membership illustrations">{nav}</nav></header><div class="reference"><figure><img src="svg/handyman-1.svg?v=29" width="360" height="270" alt="Selected H1 camera illustration"/><figcaption>H1 · Handyman Requests</figcaption></figure><figure><img src="svg/maintenance-1c.svg?v=10" width="360" height="270" alt="Selected M1C calendar illustration"/><figcaption>M1C · Maintenance Plans</figcaption></figure></div><div class="grid">{''.join(items)}</div><p class="note">The existing benefits section and Homes layout are unchanged. <a href="price-simple-before-membership.html">Previous pricing-card study</a>.</p></main></body></html>'''
(root/'price-simple.html').write_text(page)
# Compact vector contact sheet: standalone illustrations only.
parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="690" viewBox="0 0 1160 690"><rect width="1160" height="690" fill="#f4f7f4"/>'+text(32,34,'SURFSIDE / SIX MEMBERSHIP ILLUSTRATIONS',16,G,650,'start',1)]
for i,(title,note,body) in enumerate(variants):
 x=20+(i%3)*380;y=56+(i//3)*310
 parts.append(rect(x,y,360,289,W,L,1,15)+f'<svg x="{x+10}" y="{y}" width="340" height="255" viewBox="0 0 360 270">{body}</svg>'+text(x+180,y+273,f'P{i+1} · {title}',14,I,600))
parts.append('</svg>')
(root/'membership-illustrations.svg').write_text(''.join(parts))
print('Created six standalone membership illustrations and replaced the requested local comparison page.')
