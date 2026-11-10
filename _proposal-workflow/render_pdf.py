"""Generate the proposal from proposal-details.json using the reference design.

Run with the bundled Python interpreter. Task records have title and description;
pricing records have title, description and amount (a number or null). Photos have
path and caption; relative paths are resolved from the project folder.
"""
import argparse
import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable,
    KeepTogether, PageBreak, Image,
)
from PIL import Image as PILImage, ImageOps

parser = argparse.ArgumentParser(description="Render the approved Surfside proposal design.")
parser.add_argument('--project', type=Path, required=True)
parser.add_argument('--data', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
ROOT = args.project.resolve()
DATA = json.loads(args.data.read_text())
OUT = args.output.resolve()
OUT.parent.mkdir(parents=True, exist_ok=True)
ASSETS = Path(__file__).resolve().parent/'template/pdf'
INK = colors.HexColor('#183e47')
NAME = colors.HexColor('#193d50')
MUTED = colors.HexColor('#536174')
LABEL = colors.HexColor('#557580')
LINE = colors.HexColor('#c8dce4')
SOFT = colors.HexColor('#dce7de')

font_root = Path('/System/Library/Fonts/Supplemental')
if (font_root/'Arial.ttf').is_file() and (font_root/'Arial Bold.ttf').is_file():
    for name, filename in [('Body', 'Arial.ttf'), ('Strong', 'Arial Bold.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(font_root/filename)))
else:
    import reportlab
    font_root = Path(reportlab.__file__).parent/'fonts'
    for name, filename in [('Body', 'Vera.ttf'), ('Strong', 'VeraBd.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(font_root/filename)))

def style(name='body', size=10, color=MUTED, **kwargs):
    return ParagraphStyle(name, fontName='Body', fontSize=size, leading=size*1.42,
                          textColor=color, **kwargs)

BODY = style()
BOLD = style('bold', 10.8, INK)
BOLD.fontName = 'Strong'
SMALL = style('small', 9, MUTED)
CARD_BODY = style('card_body', 8.8, MUTED)
CARD_NAME = style('card_name', 9.6, NAME)
CARD_NAME.fontName = 'Strong'

def p(text, sty=BODY, bold_text=None):
    markup = escape(str(text)).replace('\n', '<br/>')
    if bold_text:
        escaped_bold = escape(str(bold_text))
        markup = markup.replace(escaped_bold, '<font name="Strong">'+escaped_bold+'</font>')
    return Paragraph(markup, sty)

class Rule(Flowable):
    def __init__(self, color=LINE, thickness=.6):
        super().__init__()
        self.width, self.height = 564, thickness
        self.color, self.thickness = color, thickness
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)

class Header(Flowable):
    def __init__(self):
        super().__init__()
        self.width, self.height = 564, 132
    def draw(self):
        c = self.canv
        c.saveState()
        clip = c.beginPath()
        clip.rect(0, 65, 564, 68)
        c.clipPath(clip, stroke=0, fill=0)
        c.drawImage(str(ASSETS/'brand-header.png'), 0, 51, width=564, height=81.075,
                    mask='auto')
        c.restoreState()
        brand = DATA['business_name'].upper()
        brand_spacing = .65
        brand_width = pdfmetrics.stringWidth(brand, 'Strong', 8.1) + brand_spacing*(len(brand)-1)
        brand_text = c.beginText((564-brand_width)/2, 54.5)
        brand_text.setFont('Strong', 8.1)
        brand_text.setFillColor(LABEL)
        brand_text.setCharSpace(brand_spacing)
        brand_text.textOut(brand)
        brand_text.setCharSpace(0)
        c.drawText(brand_text)
        c.setFillColor(MUTED)
        t = c.beginText()
        t.setFont('Body', 8.1)
        t.setCharSpace(.97)
        title = 'PROPOSAL'
        tw = pdfmetrics.stringWidth(title, 'Body', 8.1) + .97*(len(title)-1)
        t.setTextOrigin((564-tw)/2, 34)
        t.textOut(title)
        t.setCharSpace(0)
        c.drawText(t)
        c.setFillColor(INK)
        c.setFont('Body', 9.6)
        c.drawCentredString(282, 17, DATA['date'])
        c.setStrokeColor(LINE)
        c.setLineWidth(.6)
        c.line(0, 0, 564, 0)

class PartyCard(Flowable):
    def __init__(self, label, lines):
        super().__init__()
        self.label = label
        self.paragraphs = [p(text, CARD_NAME if i == 0 else CARD_BODY) for i, text in enumerate(lines)]
        self.width = 242
        self.height = max(124, 51 + sum(q.wrap(209, 1000)[1] for q in self.paragraphs)
                          + 1.3 * (len(self.paragraphs)-1))
    def draw(self):
        c = self.canv
        c.setFillColor(colors.HexColor('#f3f4f6'))
        c.setStrokeColor(colors.HexColor('#e3e7eb'))
        c.setLineWidth(.7)
        c.roundRect(0, 0, 242, self.height, 8, fill=1, stroke=1)
        t = c.beginText(16, self.height-23)
        t.setFont('Body', 7.3)
        t.setCharSpace(.7)
        t.setFillColor(LABEL)
        t.textOut(self.label)
        t.setCharSpace(0)
        c.drawText(t)
        y = self.height-35
        for i, paragraph in enumerate(self.paragraphs):
            h = paragraph.wrap(209, 1000)[1]
            y -= h
            paragraph.drawOn(c, 16, y)
            y -= 1.3

class SectionLabel(Flowable):
    def __init__(self, title):
        super().__init__()
        self.width, self.height = 564, 10
        self.title = title
        self.keepWithNext = True
    def draw(self):
        c = self.canv
        t = c.beginText()
        t.setFont('Body', 8.1)
        t.setFillColor(LABEL)
        t.setCharSpace(.65)
        tw = pdfmetrics.stringWidth(self.title, 'Body', 8.1) + .65*(len(self.title)-1)
        t.setTextOrigin((564-tw)/2, 2)
        t.textOut(self.title)
        t.setCharSpace(0)
        c.drawText(t)

def section(title):
    return [Rule(), Spacer(1, 4), SectionLabel(title), Spacer(1, 6)]

def footer(c, doc):
    if DATA.get('preview'):
        c.setFillColor(LABEL)
        c.setFont('Body', 7.5)
        c.drawString(24, 27, DATA.get('preview_note', 'PREVIEW - Project details and pricing pending'))
    c.setFillColor(LABEL)
    c.setFont('Body', 7.5)
    c.drawRightString(588, 27, str(doc.page))

doc = SimpleDocTemplate(str(OUT), pagesize=(612, 792), rightMargin=18,
                        leftMargin=18, topMargin=18, bottomMargin=48,
                        title='Proposal - '+DATA['project_name'],
                        author=DATA['business_name'])
story = [Header(), Spacer(1, 10)]
sender = DATA['prepared_by']
recipient = DATA['prepared_for']
by = [sender['name'], *sender['address'], sender['phone'], sender['email']]
to = [recipient.get('company') or '[Contractor / company]',
      recipient.get('contact') or '[Contact name]',
      *(recipient.get('address') or ['[Mailing address]']),
      recipient.get('phone') or '[Phone number]',
      recipient.get('email') or '[Email address]']
cards = [PartyCard('PREPARED BY', by), PartyCard('PREPARED FOR', to)]
cards[0].height = cards[1].height = max(card.height for card in cards)
table = Table([cards], colWidths=[258, 242], hAlign='CENTER')
table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'),
                          ('LEFTPADDING',(0,0),(-1,-1),0),
                          ('RIGHTPADDING',(0,0),(-1,-1),0),
                          ('TOPPADDING',(0,0),(-1,-1),0),
                          ('BOTTOMPADDING',(0,0),(-1,-1),0)]))
story += [table, Spacer(1, 10)]
if DATA.get('summary'):
    story += section('PROJECT SUMMARY')
    story += [p(DATA['summary'], bold_text=DATA.get('site_address')), Spacer(1, 8)]
story += section('SCOPE OF WORK')
tasks = DATA.get('tasks') or [
    {'title': '[Task 1 - title]', 'description': '[Describe the work, area or quantity, and intended result.]'},
    {'title': '[Task 2 - title]', 'description': '[Describe preparation, materials, and finish requirements.]'},
    {'title': '[Task 3 - title]', 'description': '[Describe remaining work and any task-specific exclusions.]'},
]
if DATA.get('scope_paragraph'):
    story += [p(DATA['scope_paragraph'], bold_text=DATA.get('site_address')), Spacer(1, 5)]
for task in ([] if DATA.get('scope_paragraph') else tasks):
    row = Table([[p('•', BOLD), [p(task['title'], BOLD), p(task.get('description', ''))]]],
                colWidths=[12,552])
    row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),
                            ('LEFTPADDING',(0,0),(-1,-1),0),
                            ('RIGHTPADDING',(0,0),(-1,-1),0),
                            ('TOPPADDING',(0,0),(-1,-1),0),
                            ('BOTTOMPADDING',(0,0),(-1,-1),0)]))
    story += [KeepTogether([row, Spacer(1, 9)])]
story += [Spacer(1, 1)] + section('PRICING')
pricing = DATA.get('pricing') or ([
    {'title': 'Proposal price', 'description': '', 'amount': None},
] if DATA.get('pricing_pending') else [
    {'title': 'Labor', 'description': 'Hours and rate to be provided', 'amount': None},
    {'title': 'Materials', 'description': 'Materials and quantities to be provided', 'amount': None},
])
money = lambda amount: 'To be provided' if amount is None else f'${amount:,.2f}'
right = style('amount', 10.8, INK, alignment=TA_RIGHT)
right.fontName = 'Strong'
for item_index, item in enumerate(pricing):
    rows = [[p('•', style('bullet', 10, colors.HexColor('#2695ad'))), p(item['title'], BOLD),
             p(item.get('amount_label', money(item.get('amount'))), right)]]
    if item.get('description'):
        rows.append(['', p(item['description'], SMALL), ''])
    row = Table(rows, colWidths=[13, 381, 170])
    row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),
                            ('LEFTPADDING',(0,0),(-1,-1),0),
                            ('RIGHTPADDING',(0,0),(-1,-1),0),
                            ('TOPPADDING',(0,0),(-1,-1),0),
                            ('TOPPADDING',(0,0),(-1,0),5),
                            ('BOTTOMPADDING',(0,0),(-1,-1),0),
                            ('BOTTOMPADDING',(0,-1),(-1,-1),6)]))
    if item_index < len(pricing)-1:
        row.setStyle(TableStyle([('LINEBELOW',(1,-1),(-1,-1),.6,SOFT)]))
    if len(rows) > 1:
        row.setStyle(TableStyle([('SPAN',(1,1),(2,1))]))
    story.append(KeepTogether([row]))
total = sum(item['amount'] for item in pricing) if all(item.get('amount') is not None for item in pricing) else None
totaltext = 'To be determined' if total is None else money(total)
totalstyle = style('total', 12.5, INK)
totalstyle.fontName = 'Strong'
totalright = style('totalright', 12.5, INK, alignment=TA_RIGHT)
totalright.fontName = 'Strong'
totalrow = Table([[p('Total', totalstyle), p(totaltext, totalright)]], colWidths=[300,264])
totalrow.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),
                             ('RIGHTPADDING',(0,0),(-1,-1),0),
                             ('TOPPADDING',(0,0),(-1,-1),10),
                             ('LINEABOVE',(0,0),(-1,-1),1.1,NAME)]))
if DATA.get('show_pricing_total', True) and not (DATA.get('pricing_pending') and not DATA.get('pricing')):
    story += [Spacer(1, 14), totalrow]

if DATA.get('terms'):
    story += [Spacer(1, 6)]
    story += [KeepTogether(section('TERMS') + [p(DATA['terms'], SMALL)])]

if DATA.get('photos'):
    story += [PageBreak()] + section('PROJECT PHOTOS')
    for photo in DATA['photos']:
        path = ROOT / photo['path']
        with PILImage.open(path) as raw:
            oriented = ImageOps.exif_transpose(raw)
            rgb = oriented.convert('RGB')
            cache = ROOT/'tmp/pdfs'/('photo-'+str(len(story))+'.jpg')
            cache.parent.mkdir(parents=True, exist_ok=True)
            rgb.save(cache, quality=95)
            width, height = rgb.size
        scale = min(564/width, 285/height)
        story.append(KeepTogether([Image(str(cache), width*scale, height*scale),
                                  Spacer(1, 6), p(photo.get('caption',''), SMALL), Spacer(1,18)]))

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
