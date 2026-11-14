import {demo,priceTypes} from './editor-data.mjs';
import {readDraft,saveDraft} from './draft-store.mjs';
const $=s=>document.querySelector(s), form=$('#intake-form'), frame=$('#site-preview');
const today=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/Los_Angeles'}).format(new Date());
const defaultTerms='Proposal is valid for 30 days from the date of issuance. Pricing and scheduling are subject to change based on site conditions, material availability, and unforeseen circumstances. Any changes to the scope of work require written approval and may result in additional charges.';
let draft=await readDraft(), timer, renderRevision=0, device='desktop', activeStep=0, writeQueue=Promise.resolve();
const steps=['project','contact','scope','details'], names=['Project','Prepared for','Scope & options','Details & terms'];
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
if(!draft.date)draft.date=today;
draft.heroPhotos=draft.heroPhotos||[];
if(!draft.heroPhotos.some(photo=>photo.id===draft.primaryHeroId))draft.primaryHeroId=draft.heroPhotos[0]?.id||'';
for(const control of form.elements){if(control.name && control.name in draft)control.value=draft[control.name]??'';}
function setStep(index){activeStep=index;document.querySelectorAll('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==steps[index]);document.querySelectorAll('[data-step]').forEach(el=>{el.classList.toggle('active',el.dataset.step===steps[index]);if(el.dataset.step===steps[index])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});$('#previous-step').disabled=index===0;$('#next-step').textContent=index===steps.length-1?'Review project setup →':`Next: ${names[index+1]} →`;}
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>setStep(steps.indexOf(button.dataset.step))));
$('#previous-step').onclick=()=>setStep(Math.max(0,activeStep-1));
$('#next-step').onclick=()=>activeStep===steps.length-1?reviewSetup():setStep(activeStep+1);
form.addEventListener('submit',event=>event.preventDefault());
function renderItems(){
 for(const [key,target] of [['finishes','#packages-editor'],['additions','#extras-editor']]){
  $(target).innerHTML=draft[key].map((item,index)=>`<div class="item-editor" data-list="${key}" data-id="${escape(item.id)}"><div class="field-pair"><label>${key==='finishes'?'Option':'Extra'} ${index+1}<input data-field="title" value="${escape(item.title)}"></label><label>Price ($)<input type="number" min="0" step="1" data-field="price" value="${item.price??''}"></label></div><label>Price type<select data-field="priceType">${Object.entries(priceTypes).map(([value,label])=>`<option value="${value}" ${(item.priceType||'labor-materials')===value?'selected':''}>${label}</option>`).join('')}</select></label><label data-custom-price-label ${item.priceType==='other'?'':'hidden'}>Custom price label<input data-field="priceLabel" value="${escape(item.priceLabel||'')}" placeholder="e.g. Allowance"></label><label>Short description<input data-field="note" value="${escape(item.note)}"></label><label>Scope included in the proposal<textarea rows="4" data-field="scope">${escape(item.scope)}</textarea></label>${key==='finishes'&&draft.finishes.length===1?'':'<button type="button" class="remove-item">Remove '+(key==='finishes'?'option':'extra')+'</button>'}</div>`).join('');
 }
}
function renderHeroPhotos(){
 draft.heroImage=draft.heroPhotos.find(photo=>photo.id===draft.primaryHeroId)?.src||'';
 $('#hero-upload-preview').innerHTML=draft.heroPhotos.map(photo=>`<div class="hero-upload-card ${photo.id===draft.primaryHeroId?'is-primary':''}"><img src="${escape(photo.src)}" alt="${escape(photo.name)}"><p>${escape(photo.name)}</p><div class="hero-photo-actions"><button type="button" data-primary-hero="${escape(photo.id)}" aria-pressed="${photo.id===draft.primaryHeroId}">${photo.id===draft.primaryHeroId?'✓ Primary':'Make primary'}</button><button type="button" data-remove-hero="${escape(photo.id)}" aria-label="Remove ${escape(photo.name)}">Remove</button></div></div>`).join('');
}
function resizeFrame(){const available=$('.preview-stage').clientWidth;const width=device==='mobile'?390:1200;const scale=Math.min(1,available/width);$('.frame-holder').style.width=`${width*scale}px`;frame.style.width=`${width}px`;frame.style.height=`${$('.preview-stage').clientHeight/scale}px`;frame.style.transform=`scale(${scale})`;}
new ResizeObserver(resizeFrame).observe($('.preview-stage'));
document.querySelectorAll('[data-device]').forEach(button=>button.onclick=()=>{device=button.dataset.device;document.querySelectorAll('[data-device]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));resizeFrame();});
function reloadPreview(){let scroll=0;try{scroll=frame.contentWindow.scrollY;}catch{}frame.onload=()=>{frame.contentWindow.scrollTo(0,scroll);resizeFrame();};frame.src=`./preview/?revision=${++renderRevision}`;}
function persist(){
 const snapshot=structuredClone(draft);
 $('#save-status').textContent='Saving…';
 const operation=writeQueue.then(()=>saveDraft(snapshot));
 writeQueue=operation.catch(()=>{});
 return operation.then(()=>{$('#save-status').textContent='Saved on this device';reloadPreview();}).catch(error=>{$('#save-status').textContent=error.message||'Could not save. Export a backup.';throw error;});
}
function schedule(){clearTimeout(timer);$('#save-status').textContent='Unsaved changes';timer=setTimeout(()=>persist().catch(()=>{}),700);}
form.addEventListener('input',event=>{
 const el=event.target;
 if(el.name){draft[el.name]=el.value;}
 const item=el.closest('[data-list]');
 if(item && el.dataset.field){const record=draft[item.dataset.list].find(row=>row.id===item.dataset.id);record[el.dataset.field]=el.dataset.field==='price'?(el.value.trim()===''?null:Math.max(0,Number(el.value)||0)):el.value;if(el.dataset.field==='priceType')item.querySelector('[data-custom-price-label]').hidden=el.value!=='other';}
 if(el.type!=='file')schedule();
});
form.addEventListener('click',event=>{
 const primary=event.target.closest('[data-primary-hero]');
 if(primary){draft.primaryHeroId=primary.dataset.primaryHero;renderHeroPhotos();schedule();}
 const heroRemove=event.target.closest('[data-remove-hero]');
 if(heroRemove){draft.heroPhotos=draft.heroPhotos.filter(photo=>photo.id!==heroRemove.dataset.removeHero);if(!draft.heroPhotos.some(photo=>photo.id===draft.primaryHeroId))draft.primaryHeroId=draft.heroPhotos[0]?.id||'';renderHeroPhotos();schedule();}
 const remove=event.target.closest('.remove-item');
 if(remove){const card=remove.closest('[data-list]');draft[card.dataset.list]=draft[card.dataset.list].filter(item=>item.id!==card.dataset.id);renderItems();schedule();}
});
function addItem(key){draft[key].push({id:crypto.randomUUID(),title:key==='finishes'?'New option':'Additional work',priceType:'contract',price:null,note:'',scope:''});renderItems();schedule();}
$('#add-package').onclick=()=>addItem('finishes');$('#add-extra').onclick=()=>addItem('additions');
async function readPhoto(file){
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.82);
}
$('#hero-file').onchange=async event=>{
 const input=event.target, files=Array.from(input.files);let failed=0;
 input.disabled=true;$('#save-status').textContent='Preparing photos…';
 for(const file of files){try{const photo={id:crypto.randomUUID(),src:await readPhoto(file),name:file.name.replace(/\.[^.]+$/,'')};draft.heroPhotos.push(photo);if(!draft.primaryHeroId)draft.primaryHeroId=photo.id;}catch{failed++;}}
 input.value='';input.disabled=false;renderHeroPhotos();clearTimeout(timer);
 try{await persist();if(failed)$('#save-status').textContent=`${failed} photo(s) could not load. Try JPG, PNG, or WebP.`;}catch{}
};
$('#save-draft').onclick=()=>{clearTimeout(timer);persist().catch(()=>{});};
function reviewSetup(){const slug=slugify(draft.slug||draft.street||'project-address');$('#setup-folder').textContent=`_proposal-projects/${slug}/`;$('#setup-branch').textContent=`codex/proposal-${slug}`;$('#setup-url').textContent=`https://www.surfsidepaint.com/${slug}/`;$('#setup-dialog').showModal();}
$('#review-setup').onclick=reviewSetup;
$('#export-draft').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`${slugify(draft.slug||draft.street)}_proposal-draft.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
renderItems();renderHeroPhotos();setStep(0);$('#save-status').textContent='Saved locally';reloadPreview();

// Local-only website lookup: suggestions never replace entries until applied.
const contractorFields={company:'Company name',client:'Contact name',contactAddress:'Mailing address',email:'Email',phone:'Phone'};
let contractorCandidate=null;
function renderContractorLogo(){
 const area=$('#contractor-logo-preview');area.replaceChildren();
 if(!draft.contractorLogo)return;
 const image=document.createElement('img');image.src=draft.contractorLogo;image.alt='Contractor company logo';
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remove logo';remove.onclick=()=>{draft.contractorLogo='';renderContractorLogo();schedule();};area.append(image,remove);
}
async function rasterizeLogo(src){
 const image=new Image();image.src=src;await image.decode();
 const scale=Math.min(1,600/image.naturalWidth,240/image.naturalHeight);
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
}
$('#contractor-logo-file').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});draft.contractorLogo=await rasterizeLogo(data);renderContractorLogo();schedule();}catch{$('#lookup-status').textContent='This logo could not load. Try a PNG, JPG, or WebP file.';}
 event.target.value='';
};
$('#find-contractor').onclick=async()=>{
 const website=form.elements.website.value.trim(), status=$('#lookup-status'), button=$('#find-contractor');
 if(!website){status.textContent='Enter the contractor’s website first.';form.elements.website.focus();return;}
 button.disabled=true;button.textContent='Finding…';status.textContent='Looking for contact details and a company logo…';
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),35000);
 try{
  const base=location.origin;
  const response=await fetch(`${base}/api/contractor?url=${encodeURIComponent(website)}`,{signal:controller.signal});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Website lookup failed.');
  contractorCandidate=result;
  if(result.logo){try{contractorCandidate.logo=await rasterizeLogo(result.logo);}catch{contractorCandidate.logo='';result.warning='The logo could not be converted. You can upload a PNG, JPG, or WebP manually.';}}
  $('#contractor-review-fields').innerHTML=Object.entries(contractorFields).map(([key,label])=>`<div class="lookup-field"><label class="lookup-check"><input type="checkbox" data-apply-field="${key}" ${result.details[key]?'checked':''}><span>Use</span></label><label>${label}<input data-review-field="${key}" value="${escape(result.details[key])}" placeholder="Not found — enter manually">${result.sources[key]?`<small>Source: <a href="${escape(result.sources[key])}" target="_blank" rel="noopener noreferrer">Website ↗</a></small>`:''}</label></div>`).join('');
  $('#contractor-review-logo').replaceChildren();
  if(result.logo){const label=document.createElement('label');label.className='lookup-logo-choice';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='apply-website-logo';checkbox.checked=true;const image=document.createElement('img');image.src=result.logo;image.alt='Suggested contractor logo';label.append(checkbox,document.createTextNode('Use company logo'),image);$('#contractor-review-logo').append(label);}
  const missing=Object.keys(contractorFields).filter(key=>!result.details[key]).length;
  $('#contractor-review-warning').textContent=[missing?'Some details were not found. You can fill them in manually.':'',!result.logo?'No usable logo found; manual upload is available.':'',result.warning].filter(Boolean).join(' ');
  status.textContent='Suggestions ready for review.';$('#contractor-review').showModal();
 }catch(error){status.textContent=error.name==='AbortError'?'Lookup timed out. Try again or enter the details manually.':error.message==='Failed to fetch'?'Local editor service is unavailable. Restart this project’s editor or enter details manually.':error.message;}
 finally{clearTimeout(timeout);button.disabled=false;button.textContent='Find details';}
};
$('#close-contractor-review').onclick=()=>$('#contractor-review').close();
$('#cancel-contractor-review').onclick=()=>$('#contractor-review').close();
$('#contractor-review-form').onsubmit=event=>{
 event.preventDefault();
 for(const key of Object.keys(contractorFields))if($(`[data-apply-field="${key}"]`).checked){const value=$(`[data-review-field="${key}"]`).value.trim();if(value){draft[key]=value;form.elements[key].value=value;}}
 if($('#apply-website-logo')?.checked)draft.contractorLogo=contractorCandidate.logo;
 draft.website=contractorCandidate.website;form.elements.website.value=draft.website;
 renderContractorLogo();schedule();$('#contractor-review').close();$('#lookup-status').textContent='Selected details applied. You can edit them below.';
};
renderContractorLogo();
