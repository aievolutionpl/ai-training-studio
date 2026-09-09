import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import sizeOf from 'image-size';
import {renderBur} from './bur-layouts.mjs';
import {deduplicateMedia} from './pptx-media.mjs';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/,'$1'));
const project=path.join(root,'projects/bur-2026-09-09');
const mid=id=>{if(!/^M(0[1-9]|1[0-4])$/.test(id||''))throw Error('Nieznany moduł.');return id;};
const hex=c=>/^#[\da-f]{6}$/i.test(c||'');
export function assetFile(url){
 if(typeof url!=='string'||!/^\/(assets\/generated\/[a-f0-9]{64}\.(png|jpg)|icons\/modern\/[a-z]+-[a-f0-9]{6}\.png)$/.test(url))throw Error('Nieprawidłowy zasób.');
 return path.join(root,'public',url.slice(1));
}
export function validateScene(d){
 if(!d||d.format!=='aievo-visual-v1'||typeof d.title!=='string'||d.title.length>180||!Array.isArray(d.slides)||!d.slides.length||d.slides.length>60)throw Error('Nieprawidłowy projekt edytora.');
 for(const s of d.slides){
  if(!s.canvas||!Array.isArray(s.canvas.objects)||s.canvas.objects.length>350||!hex(s.canvas.background))throw Error('Nieprawidłowy slajd.');
  if(typeof s.notes!=='string'||s.notes.length>30000)throw Error('Nieprawidłowe notatki.');
  for(const o of s.canvas.objects){
   if(!['Textbox','Rect','Ellipse','Line','Image'].includes(o.type))throw Error('Nieobsługiwany element.');
   for(const k of ['left','top','width','height','scaleX','scaleY','angle','opacity'])if(o[k]!==undefined&&(!Number.isFinite(o[k])||Math.abs(o[k])>20000))throw Error('Nieprawidłowa geometria.');
   if((o.width||0)<0||(o.height||0)<0||(o.scaleX??1)<=0||(o.scaleY??1)<=0)throw Error('Nieprawidłowy rozmiar.');
   if(o.type==='Image')assetFile(o.src);
   if(o.type==='Textbox'&&(typeof o.text!=='string'||o.text.length>10000||!Number.isFinite(o.fontSize)||o.fontSize<1||o.fontSize>400))throw Error('Nieprawidłowy tekst.');
   if(o.clipPath && (o.clipPath.type!=='Rect'||o.clipPath.clipPath))throw Error('Nieprawidłowa maska.');
   if(o.filters?.length||o.shadow)throw Error('Filtry obrazu nie są obsługiwane.');
  }
 }
 return d;
}
export async function moduleScene(id){
 const d=JSON.parse(await fs.readFile(path.join(project,mid(id),'deck.json'),'utf8'));
 const slides=d.slides.map((s,i)=>{
  const objects=[];const base=o=>({left:o.x*96,top:o.y*96,width:o.w*96,height:o.h*96,scaleX:1,scaleY:1,angle:0,opacity:1,originX:'left',originY:'top',id:randomUUID(),strokeWidth:0});
  const slide={background:{},addText(text,o){objects.push({...base(o),type:'Textbox',text,fontSize:o.fontSize*96/72,fontFamily:o.fontFace,fontWeight:o.bold?'bold':'normal',fill:'#'+o.color,textAlign:o.align||'left',lineHeight:1.16,top:(o.y+Math.max(0,(o.h-text.split('\n').length*o.fontSize/72*1.16)/2))*96,name:text.slice(0,44)});},
   addShape(type,o){objects.push({...base(o),type:type==='line'?'Line':type==='ellipse'?'Ellipse':'Rect',rx:type==='ellipse'?o.w*48:type==='roundRect'?12:0,ry:type==='ellipse'?o.h*48:type==='roundRect'?12:0,fill:o.fill?'#'+o.fill.color:'transparent',opacity:1-(o.fill?.transparency||0)/100,stroke:o.line?.color?'#'+o.line.color:undefined,strokeWidth:o.line?.transparency===100?0:(o.line?.width||0)*96/72,x1:0,y1:0,x2:o.w*96,y2:o.h*96,name:type==='line'?'Linia':'Kształt',locked:o.w>12&&o.h>7});},
   addImage(o){const dims=sizeOf(o.path);const w=(o.sizing?.w||o.w)*96,h=(o.sizing?.h||o.h)*96;const contain=o.sizing?.type==='contain',ratio=contain?Math.min(w/dims.width,h/dims.height):Math.max(w/dims.width,h/dims.height);const iw=contain?dims.width:w/ratio,ih=contain?dims.height:h/ratio;objects.push({...base(o),type:'Image',src:'/'+path.relative(path.join(root,'public'),o.path).replaceAll('\\','/'),width:iw,height:ih,scaleX:ratio,scaleY:ratio,left:o.x*96+(contain?(w-iw*ratio)/2:0),top:o.y*96+(contain?(h-ih*ratio)/2:0),cropX:(dims.width-iw)/2,cropY:(dims.height-ih)/2,name:o.altText==='BUR_ROUND'?'Ilustracja':'Obraz',locked:w>1200&&h>700,...(o.altText==='BUR_ROUND'?{clipPath:{type:'Rect',width:iw,height:ih,rx:Math.min(iw,ih)*.06,ry:Math.min(iw,ih)*.06,originX:'center',originY:'center',left:0,top:0}}:{})});}
  };
  renderBur(slide,{ShapeType:{rect:'rect',roundRect:'roundRect',ellipse:'ellipse',line:'line'}},s,d.burTheme,root,d,i);
  return {id:randomUUID(),title:s.title,notes:[s.voiceScript,s.notes].filter(Boolean).join('\n\n'),canvas:{version:'6.9.0',background:'#'+slide.background.color,objects}};
 });
 return {format:'aievo-visual-v1',moduleId:id,title:d.title,slides};
}
export async function catalog(){
 const items=new Map();
 for(let i=1;i<=14;i++){const id='M'+String(i).padStart(2,'0');const d=JSON.parse(await fs.readFile(path.join(project,id,'deck.json'),'utf8'));for(const [n,s] of d.slides.entries())if(s.image){const src='/assets/'+s.image;if(!items.has(src))items.set(src,{src,name:`${id} · ${s.title}`,category:n===0?'Okładki':'Ilustracje'});}if(d.backgroundImage)items.set('/assets/'+d.backgroundImage,{src:'/assets/'+d.backgroundImage,name:'Jasny granit',category:'Tła'});}
 for(const f of await fs.readdir(path.join(root,'public/icons/modern')))if(f.endsWith('-192333.png'))items.set('/icons/modern/'+f,{src:'/icons/modern/'+f,name:f.split('-')[0],category:'Ikony'});
 try{for(const a of JSON.parse(await fs.readFile(path.join(project,'editor-assets.json'),'utf8')))items.set(a.src,a);}catch{}
 return [...items.values()];
}
export async function uploadAsset(d){
 if(typeof d.data!=='string'||!/^data:image\/(png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(d.data))throw Error('Wybierz PNG lub JPG.');
 const bytes=Buffer.from(d.data.split(',')[1],'base64');if(bytes.length>8*1024*1024)throw Error('Maksymalnie 8 MB.');if(!(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes[0]===255&&bytes[1]===216&&bytes[2]===255))throw Error('Wybierz prawdziwy PNG lub JPG.');const dims=sizeOf(bytes);if(!['png','jpg'].includes(dims.type)||dims.width*dims.height>40000000)throw Error('Zbyt duży lub nieobsługiwany obraz.');
 const src='/assets/generated/'+createHash('sha256').update(bytes).digest('hex')+'.'+dims.type;await fs.writeFile(assetFile(src),bytes);
 let items=[];try{items=JSON.parse(await fs.readFile(path.join(project,'editor-assets.json'),'utf8'));}catch{}
 const a={src,name:String(d.name||'Mój obraz').slice(0,100),category:'Moje'};items=items.filter(x=>x.src!==src);items.push(a);await fs.writeFile(path.join(project,'editor-assets.json'),JSON.stringify(items));return a;
}
export async function saveDraft(d){validateScene(d);const id=mid(d.moduleId);await fs.mkdir(path.join(project,'editor-drafts'),{recursive:true});const file=path.join(project,'editor-drafts',id+'.json');const tmp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(d));await fs.rename(tmp,file);return {savedAt:new Date().toISOString()};}
export async function loadDraft(id){try{return validateScene(JSON.parse(await fs.readFile(path.join(project,'editor-drafts',mid(id)+'.json'),'utf8')));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
export async function exportScene(d){
 validateScene(d);const p=new PptxGenJS();p.layout='LAYOUT_WIDE';p.title=d.title;p.author='AI Evolution';
 for(const s of d.slides){const sl=p.addSlide();sl.background={color:s.canvas.background.slice(1)};sl.addNotes(s.notes);
  for(const o of s.canvas.objects){if(o.visible===false)continue;const x=o.left/96,y=o.top/96,w=Math.max(.001,o.width*(o.scaleX??1)/96),h=Math.max(.001,o.height*(o.scaleY??1)/96);const opt={x,y,w,h,rotate:((o.angle||0)%360+360)%360};const color=(v,f='192333')=>hex(v)?v.slice(1):f;const fill={color:color(o.fill,'FFFFFF'),transparency:o.fill==='transparent'?100:100*(1-(o.opacity??1))};const line={color:color(o.stroke),width:(o.strokeWidth||0)*.75,transparency:o.strokeWidth?0:100};
   if(o.type==='Textbox')sl.addText(o.text,{...opt,fontFace:o.fontFamily||'Manrope',fontSize:o.fontSize*(o.scaleY??1)*.75,bold:o.fontWeight==='bold'||o.fontWeight>=600,italic:o.fontStyle==='italic',underline:!!o.underline,color:color(o.fill),align:o.textAlign||'left',valign:'top',margin:0,breakLine:false,paraSpaceAfter:0,transparency:100*(1-(o.opacity??1))});
   else if(o.type==='Image'){const file=assetFile(o.src),dims=sizeOf(file);sl.addImage({...opt,path:file,altText:o.clipPath?'BUR_ROUND':'EDITOR_IMAGE',w:dims.width*(o.scaleX??1)/96,h:dims.height*(o.scaleY??1)/96,sizing:{type:'crop',w,h,x:(o.cropX||0)*(o.scaleX??1)/96,y:(o.cropY||0)*(o.scaleY??1)/96},transparency:100*(1-(o.opacity??1)),flipH:!!o.flipX,flipV:!!o.flipY});}
   else sl.addShape(o.type==='Line'?p.ShapeType.line:o.type==='Ellipse'?p.ShapeType.ellipse:o.rx?p.ShapeType.roundRect:p.ShapeType.rect,{...opt,fill,line});
  }
 }
 const z=await JSZip.loadAsync(await p.write({outputType:'nodebuffer'}));for(const [n,f] of Object.entries(z.files))if(/^ppt\/slides\/slide\d+\.xml$/.test(n)){let xml=await f.async('string');const si=Number(n.match(/slide(\d+)/)[1])-1;const rounded=d.slides[si].canvas.objects.filter(o=>o.type==='Rect'&&o.rx&&o.visible!==false);let ri=0;xml=xml.replace(/<a:prstGeom prst="roundRect">.*?<\/a:prstGeom>/gs,()=>{const o=rounded[ri++];const adj=o?Math.min(50000,Math.round(o.rx/Math.min(o.width,o.height)*100000)):6000;return '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val '+adj+'"/></a:avLst></a:prstGeom>';});xml=xml.replace(/<p:pic>.*?<\/p:pic>/gs,b=>b.includes('BUR_ROUND')?b.replace(/<a:prstGeom prst="rect">.*?<\/a:prstGeom>/s,'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 6000"/></a:avLst></a:prstGeom>'):b);z.file(n,xml);}await deduplicateMedia(z);return z.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
