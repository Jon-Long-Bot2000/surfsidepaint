import { PDFDocument, StandardFonts, rgb } from './vendor/pdf-lib.esm.min.js';
import {demo, money, priceLabel} from './data.mjs?v=price-types';

const hex = value => rgb(...value.match(/[a-f\d]{2}/gi).map(x => parseInt(x,16)/255));
const ink=hex('183e47'), muted=hex('536174'), label=hex('557580'), line=hex('c8dce4'), green=hex('005e4b');
const logoBytes = fetch('./paint-house.png').then(response => {if(!response.ok)throw Error('Logo could not load.');return response.arrayBuffer();});

export async function createSelectedPDF(plan) {
 const doc = await PDFDocument.create();
 doc.setTitle(`${demo.street} - Selected proposal`);
 doc.setAuthor(demo.businessName);
 doc.setSubject(demo.preview?'Draft proposal for review':'Work proposal with selected scope');
 const font=await doc.embedFont(StandardFonts.Helvetica), bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const logo=await doc.embedPng(await logoBytes);
 const contractorLogo=demo.contractorLogo?await doc.embedPng(demo.contractorLogo.startsWith('data:')?demo.contractorLogo:await (await fetch(demo.contractorLogo)).arrayBuffer()):null;
 let page=doc.addPage([612,792]), y=768;
 const text=(value,x,top,size=9.5,color=muted,strong=false) => page.drawText(String(value),{x,y:top-size,size,font:strong?bold:font,color});
 const center=(value,top,size=8,color=label,strong=false) => {const f=strong?bold:font;text(value,(612-f.widthOfTextAtSize(value,size))/2,top,size,color,strong);};
 const rule=top=>page.drawLine({start:{x:24,y:top},end:{x:588,y:top},thickness:.6,color:line});
 const ensure=height=>{if(y-height<65){page=doc.addPage([612,792]);y=754;}};
 function wrapped(value,width,size=9.5,strong=false) {
  const lines=[],f=strong?bold:font;
  for(const paragraph of String(value).split('\n')) {
   let current='';
   for(const word of paragraph.split(/\s+/)) {
    const next=current?current+' '+word:word;
    if(current && f.widthOfTextAtSize(next,size)>width){lines.push(current);current=word;}else current=next;
   }
   lines.push(current);
  }
  return lines;
 }
 function paragraph(value,{x=24,width=564,size=9.5,color=muted,strong=false}={}) {
  for(const row of wrapped(value,width,size,strong)){ensure(size*1.45);text(row,x,y,size,color,strong);y-=size*1.45;}
 }
 function section(title) {ensure(52);y-=12;rule(y);y-=6;center(title,y,8,label);y-=22;}
 const by=[demo.businessName,demo.preparedBy.name,...demo.preparedBy.address,demo.preparedBy.phone,demo.preparedBy.email].filter(Boolean);
 const to=[demo.company,demo.client,demo.contactAddress,demo.email,demo.phone].filter(Boolean);
 const cardRows=values=>values.flatMap((value,index)=>wrapped(value,210,index===0?9.6:8.8,index===0).map(row=>({row,index})));
 const cardHeight=Math.max(110,50+Math.max(cardRows(by).length,cardRows(to).length)*13);
 function card(x,top,heading,values,companyLogo=null) {
  const w=242,h=cardHeight,r=8;
  page.drawSvgPath(`M ${r} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`,{x,y:top,color:hex('f3f4f6'),borderColor:hex('e3e7eb'),borderWidth:.7});
  text(heading,x+16,top-16,7.3,label);
  if(companyLogo){const scale=Math.min(62/companyLogo.width,24/companyLogo.height);const w=companyLogo.width*scale,h=companyLogo.height*scale;page.drawImage(companyLogo,{x:x+242-16-w,y:top-21-h/2,width:w,height:h});}
  cardRows(values).forEach(({row,index},i)=>text(row,x+16,top-39-i*13,index===0?9.6:8.8,index===0?ink:muted,index===0));
 }
 page.drawImage(logo,{x:276,y:716,width:60,height:60});
 center(demo.businessName.toUpperCase(),706,8.1,label,true);
 center('P R O P O S A L',687,8.1,muted);
 center(demo.date,666,9.6,ink);
 rule(644);
 card(48,630,'PREPARED BY',by);
 card(322,630,'PREPARED FOR',to,contractorLogo);
 y=630-cardHeight-4;
 if(demo.summary?.trim()){section('PROJECT SUMMARY'); paragraph(demo.summary);}
 section('SCOPE OF WORK');
 paragraph(plan.finish.scope||'[Scope to be provided]');
 for(const extra of plan.extras){y-=4;paragraph(extra.scope);}
 section('PRICING');
 const rows=[{title:plan.finish.title,price:plan.finish.price,description:priceLabel(plan.finish)},...plan.extras.map(item=>({title:item.title,price:item.price,description:[priceLabel(item),item.note].filter(Boolean).join(' · ')}))];
 for(let i=0;i<rows.length;i++) {
  const row=rows[i];ensure(43);
  text('•',26,y+1,10,hex('2695ad'));
  text(row.title,38,y,10.5,ink,true);
  const amount=row.price===null?'Price pending':money(row.price);text(amount,588-bold.widthOfTextAtSize(amount,10.5),y,10.5,ink,true);
  y-=17;paragraph(row.description,{x:38,width:550,size:8.8});y-=8;
  if(i<rows.length-1){rule(y+2);y-=5;}
 }
 if(demo.priceNote?.trim()){paragraph(demo.priceNote.trim(),{x:38,width:550,size:8.8});y-=8;}
 ensure(42);rule(y);y-=12;text('Proposal total',38,y,11.5,ink,true);
 const total=plan.pending?'Price pending':money(plan.total);text(total,588-bold.widthOfTextAtSize(total,12),y,12,green,true);y-=21;
 for(const [heading,value] of [['MATERIALS',demo.materials],['SCHEDULE',demo.schedule],['EXCLUSIONS',demo.exclusions]]){if(value?.trim()){section(heading);paragraph(value.trim(),{size:8.5});}}
 if(demo.terms?.trim()){section('TERMS');paragraph(demo.terms.trim(),{size:8.5});}
 for(const [index,p] of doc.getPages().entries()) {
  if(demo.preview)p.drawText('DRAFT - Not approved for submission',{x:24,y:27,size:7,font,color:label});
  p.drawText(String(index+1),{x:582,y:27,size:7.5,font,color:label});
 }
 return doc.save();
}
