"""Generate the CA Autobody CMS operator handbook from the dashboard's chapter data."""
import json
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

root=Path(__file__).resolve().parent
chapters=json.loads((root/'CA_AUTOBODY_CMS_USER_MANUAL.json').read_text())
out=root/'CA_Autobody_CMS_User_Manual.pdf'
NAVY=colors.HexColor('#20262C'); GOLD=colors.HexColor('#A27B43'); MUTED=colors.HexColor('#63717C'); LINE=colors.HexColor('#E4E8EC')
styles={
 'cover-eyebrow':ParagraphStyle('CoverKicker',fontName='Helvetica-Bold',fontSize=11,leading=16,textColor=GOLD,spaceAfter=18),
 'cover-title':ParagraphStyle('CoverTitle',fontName='Helvetica-Bold',fontSize=36,leading=42,textColor=NAVY,spaceAfter=16),
 'cover-lede':ParagraphStyle('CoverLede',fontName='Helvetica',fontSize=13,leading=21,textColor=MUTED,spaceAfter=24),
 'chapter-eyebrow':ParagraphStyle('ChapterEyebrow',fontName='Helvetica-Bold',fontSize=10,leading=14,textColor=GOLD,spaceAfter=8),
 'chapter-title':ParagraphStyle('ChapterTitle',fontName='Helvetica-Bold',fontSize=26,leading=31,textColor=NAVY,spaceAfter=12),
 'chapter-lede':ParagraphStyle('ChapterLede',fontName='Helvetica',fontSize=11,leading=18,textColor=MUTED,spaceAfter=18),
 'label':ParagraphStyle('SectionLabel',fontName='Helvetica-Bold',fontSize=9,leading=14,textColor=GOLD,spaceBefore=16,spaceAfter=6),
 'body':ParagraphStyle('BodyTextCA',fontName='Helvetica',fontSize=10.4,leading=16.5,textColor=NAVY,spaceAfter=11),
 'toc':ParagraphStyle('TableContents',fontName='Helvetica',fontSize=11,leading=16,textColor=NAVY),
 'note':ParagraphStyle('NoteCA',fontName='Helvetica',fontSize=10,leading=15,textColor=MUTED),
}
doc=SimpleDocTemplate(str(out),pagesize=A4,leftMargin=23*mm,rightMargin=23*mm,topMargin=27*mm,bottomMargin=22*mm,title='CA Autobody | CMS Admin User Manual',author='CA Autobody')
story=[Spacer(1,25*mm),Paragraph('CA / AUTOBODY &nbsp;&nbsp;•&nbsp;&nbsp; CMS OPERATIONS',styles['cover-eyebrow']),Paragraph('Your website.<br/>A clear path<br/>from draft to live.',styles['cover-title']),Paragraph('The complete, step-by-step handbook for the premium CA Autobody administration workspace, content publishing, gallery management and reporting.',styles['cover-lede']),Spacer(1,18*mm)]
intro=Table([[Paragraph(f'{len(chapters)} CHAPTERS',styles['chapter-eyebrow']),Paragraph('2026 EDITION',styles['chapter-eyebrow'])]],colWidths=[80*mm,60*mm]);story.append(intro)
story.append(Spacer(1,8*mm));story.append(Paragraph('Designed for content editors, publishers and administrators. Website content and access permissions remain controlled by the existing CMS.',styles['note']))
story.append(PageBreak())
story += [Paragraph('AT A GLANCE',styles['chapter-eyebrow']),Paragraph('Contents',styles['chapter-title']),Paragraph('The quick reference to your daily website management workflow.',styles['chapter-lede'])]
for i,ch in enumerate(chapters,1):
 row=Table([[Paragraph(f'{i:02d}',styles['chapter-eyebrow']),Paragraph(escape(ch['title']),styles['toc'])]],colWidths=[15*mm,146*mm]);row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),.5,LINE),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.append(row)
story.append(PageBreak())
for i,ch in enumerate(chapters,1):
 story += [Paragraph(f'CHAPTER {i:02d} / CMS HANDBOOK',styles['chapter-eyebrow']),Paragraph(escape(ch['title']),styles['chapter-title']),Paragraph(escape(ch['summary']),styles['chapter-lede']),Paragraph('WHERE THIS APPEARS',styles['label']),Paragraph(escape(ch['website']),styles['body']),Spacer(1,7*mm),Paragraph('HOW TO USE IT',styles['label'])]
 for j,step in enumerate(ch['steps'],1):
  body=Table([[Paragraph(f'{j:02d}',styles['chapter-eyebrow']),Paragraph(escape(step),styles['body'])]],colWidths=[14*mm,147*mm]);body.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),.4,LINE),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.append(KeepTogether(body))
 if ch.get('caution'):
  story.append(KeepTogether([Spacer(1,5*mm),Paragraph('IMPORTANT',styles['label']),Paragraph(escape(ch['caution']),styles['note'])]))
 if i!=len(chapters): story.append(PageBreak())

def page_frame(canvas,doc):
 canvas.saveState();width,height=A4
 canvas.setStrokeColor(LINE);canvas.line(23*mm,height-20*mm,width-23*mm,height-20*mm)
 canvas.setFont('Helvetica-Bold',8);canvas.setFillColor(GOLD);canvas.drawString(23*mm,height-16.3*mm,'CA  /  AUTOBODY')
 canvas.setFillColor(MUTED);canvas.setFont('Helvetica',8);canvas.drawRightString(width-23*mm,height-16.3*mm,'CMS USER MANUAL')
 canvas.setStrokeColor(LINE);canvas.line(23*mm,16*mm,width-23*mm,16*mm)
 canvas.drawString(23*mm,11*mm,'PRIVATE ADMIN WORKSPACE  •  TRAINING REFERENCE')
 canvas.drawRightString(width-23*mm,11*mm,f'{doc.page:02d}')
 canvas.restoreState()

doc.build(story,onFirstPage=page_frame,onLaterPages=page_frame)
print(out)
