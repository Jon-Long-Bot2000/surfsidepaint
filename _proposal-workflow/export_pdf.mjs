import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const directory=path.resolve(process.argv[2]), filename=process.argv[3];
if(!filename || path.basename(filename)!==filename)throw Error('Invalid output filename.');
globalThis.fetch=async relative=>{
 const parsed=new URL(relative,'https://local.invalid/');
 if(parsed.origin!=='https://local.invalid')throw Error('PDF export only reads bundled local assets.');
 const file=path.resolve(directory,'.'+decodeURIComponent(parsed.pathname));
 if(!file.startsWith(directory+path.sep))throw Error('Asset leaves the bundle.');
 const data=await fs.readFile(file);
 return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};
};
const {demo,selectedPlan}=await import(pathToFileURL(path.join(directory,'data.mjs')).href+'?v=price-types');
const {createSelectedPDF}=await import(pathToFileURL(path.join(directory,'pdf.mjs')).href);
await fs.writeFile(path.join(directory,filename),await createSelectedPDF(selectedPlan(demo.finishes[0].id,new Set(demo.selectedExtras||[]))));
