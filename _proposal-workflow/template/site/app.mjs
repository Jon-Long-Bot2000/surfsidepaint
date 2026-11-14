import {demo,money,selectedPlan,priceLabel} from './data.mjs?v=price-types';
import {createSelectedPDF} from './pdf.mjs?v=optional-details';
import * as pdfjs from './vendor/pdf.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.mjs',import.meta.url).href;
const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('#hero-title').textContent=demo.street;
const heroSummary=$('.demo-description');heroSummary.replaceChildren();const summaryLabel=document.createElement('strong');summaryLabel.textContent='Project Summary: ';heroSummary.append(summaryLabel,document.createTextNode(demo.summary));
$('.package-fieldset legend').textContent=demo.packageLabel;
$('.total-group small').textContent=demo.priceNote;
$('#download-pdf').download=`${demo.slug||'Sample'}_Surfside_Proposal.pdf`;
if(demo.heroPhotos?.length){
 $('.hero-photo').hidden=false;
 const figure=$('.hero-photo'), image=figure.querySelector('img'), note=figure.querySelector('figcaption');
 const media=document.createElement('div');media.className='hero-media';figure.before(media);media.append(figure);
 const thumbnails=document.createElement('div');thumbnails.className='hero-thumbnails';thumbnails.setAttribute('role','group');thumbnails.setAttribute('aria-label','Additional project photos');media.append(thumbnails);
 const primary=demo.heroPhotos.find(photo=>photo.id===demo.primaryHeroId)||demo.heroPhotos[0];
 function showHero(photo,restoreFocus=false){
  image.src=photo.src;image.alt=photo.name||demo.address;note.textContent=photo.caption||'';note.hidden=!photo.caption;
  thumbnails.replaceChildren();
  for(const extra of demo.heroPhotos.filter(item=>item.id!==photo.id)){
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`View ${extra.name||'project photo'}`);
   const thumb=document.createElement('img');thumb.src=extra.src;thumb.alt='';thumb.loading='lazy';button.append(thumb);
   button.addEventListener('click',()=>showHero(extra,true));thumbnails.append(button);
  }
  thumbnails.hidden=demo.heroPhotos.length<2;
  if(restoreFocus){figure.tabIndex=-1;figure.focus({preventScroll:true});}
 }
 showHero(primary);
}else{$('.hero').classList.add('hero-without-photo');}


let finish=demo.finishes[0].id,additions=new Set(demo.selectedExtras||[]),revision=0,pdfURL=null;
$('#finish-options').innerHTML=demo.finishes.map((option,index)=>`<label class="finish-card"><span class="choice-top"><span class="option-tag">OPTION ${String.fromCharCode(65+index)}</span><input type="radio" name="finish" value="${option.id}" aria-label="${escape(option.title)}, ${(option.price===null?'Price pending':money(option.price))}" ${option.id===finish?'checked':''}></span><span class="finish-name">${escape(option.title)}</span><span class="finish-note">${escape(option.note)}</span><span class="finish-price">${(option.price===null?'Price pending':money(option.price))}</span><small class="option-price-type">${escape(priceLabel(option))}</small></label>`).join('');
$('#additional-options').innerHTML=demo.additions.map(item=>`<label class="extra-choice"><input type="checkbox" name="addition" value="${item.id}" ${additions.has(item.id)?'checked':''} aria-label="${escape(item.title)}, ${(item.price===null?'Price pending':money(item.price))}"><span class="extra-copy">${escape(item.title)}<small>${escape(item.note)}</small></span><span class="extra-price">+${(item.price===null?'Price pending':money(item.price))}</span></label>`).join('');

async function refresh() {
 const current=++revision,plan=selectedPlan(finish,additions);
 $('#selected-total').textContent=plan.pending?'Price pending':money(plan.total);
 $('.total-group small').textContent=plan.extras.length?'Selected option + additional work':priceLabel(plan.finish);
 $('#selection-description').textContent=[plan.finish.title,...plan.extras.map(item=>item.title)].join(' + ');
 $('#selection-difference').textContent=plan.pending?'Pricing to be confirmed':plan.total===demo.finishes[0].price?'Starting configuration':`${money(plan.total-demo.finishes[0].price)} above the starting configuration`;
 $('#selection-announcement').textContent=`${plan.finish.title}, ${plan.extras.length} additional items. Selected proposal total ${money(plan.total)}.`;
 $('#download-pdf').setAttribute('aria-disabled','true');
 $('#open-pdf').setAttribute('aria-disabled','true');
 $('#viewer-status').textContent='Updating PDF…';
 try {
  const bytes=await createSelectedPDF(plan);
  if(current!==revision)return;
  const pdf=await pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false}).promise;
  const fragment=document.createDocumentFragment();
  for(let i=1;i<=pdf.numPages;i++) {
   const p=await pdf.getPage(i),viewport=p.getViewport({scale:2.5});
   const section=document.createElement('section');section.className='pdf-page';section.setAttribute('aria-label',`Selected proposal, page ${i} of ${pdf.numPages}`);
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.setAttribute('aria-hidden','true');
   await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
   const content=await p.getTextContent();
   const bodyItems=content.items.filter(item=>item.str?.trim() && item.transform[5]>50);
   const contentBottom=bodyItems.reduce((bottom,item)=>Math.max(bottom,viewport.convertToViewportPoint(item.transform[4],item.transform[5])[1]+Math.abs(item.height||10)*viewport.scale),0);
   const displayCanvas=document.createElement('canvas');
   displayCanvas.width=canvas.width;
   displayCanvas.height=bodyItems.length?Math.min(canvas.height,Math.ceil(contentBottom+20*viewport.scale)):canvas.height;
   displayCanvas.setAttribute('aria-hidden','true');
   displayCanvas.getContext('2d').drawImage(canvas,0,0);
   const accessible=document.createElement('p');accessible.className='screen-reader-text';accessible.textContent=content.items.map(item=>item.str||'').join(' ');
   section.append(displayCanvas,accessible);fragment.append(section);
  }
  await pdf.destroy();
  if(current!==revision)return;
  const oldURL=pdfURL;pdfURL=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));

  $('#pdf-pages').replaceChildren(fragment);
  $('#download-pdf').href=pdfURL;$('#open-pdf').href=pdfURL;
  $('#download-pdf').setAttribute('aria-disabled','false');$('#open-pdf').setAttribute('aria-disabled','false');
  $('#viewer-status').textContent='Matches your current choices';
  if(oldURL)URL.revokeObjectURL(oldURL);
 } catch(error) {
  if(current===revision){$('#viewer-status').textContent='PDF could not be updated. Please select again or reload the page.';console.error(error);}
 }
}

document.addEventListener('change',event=>{
 const control=event.target;
 if(control.name==='finish'){finish=control.value;refresh();}
 if(control.name==='addition'){if(control.checked)additions.add(control.value);else additions.delete(control.value);refresh();}
});

for(const link of [$('#download-pdf'),$('#open-pdf')])link.addEventListener('click',event=>{if(link.getAttribute('aria-disabled')==='true')event.preventDefault();});
refresh();
