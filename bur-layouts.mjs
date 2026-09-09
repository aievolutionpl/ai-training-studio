import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import sizeOf from 'image-size';
import fs from 'node:fs';
const metrics=JSON.parse(fs.readFileSync(new URL('./font-metrics.json',import.meta.url),'utf8'));
function wrapText(value,width,size,font,bold){
 const m=metrics[font+Number(bold)]||metrics['Segoe UI0'];
 const measure=t=>Array.from(t).reduce((n,c)=>n+(m[c]||0.6),0)*size;
 return String(value).split('\n').map(par=>{let lines=[],line='';for(const word of par.split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>width*72*0.94){lines.push(line);line=word;}else line=next;}lines.push(line);return lines.join('\n');}).join('\n');
}
import {iconData} from './icons.mjs';
export const burLayouts=['image','anatomy','evidence','timeline','decision','case','matrix'];
// BUR compositions use the Studio's native PptxGenJS engine and editable text.
export function renderBur(slide,p,s,theme,root,d,index){
 const t={...theme,...d.burTheme};
 const dark=false;
 const bg=dark?t.fg:t.bg,fg=dark?t.bg:t.fg,accent=dark?t.highlight:t.accent;
 slide.background={color:bg};
 const rect=(x,y,w,h,color)=>slide.addShape(p.ShapeType.roundRect,{x,y,w,h,radius:0.15,rectRadius:0.15,line:{color:t.accent,width:0.7,transparency:65},fill:{color}});
 const dot=(x,y,w,h,color,transparency=0)=>slide.addShape(p.ShapeType.ellipse,{x,y,w,h,line:{color,transparency:100},fill:{color,transparency}});
 const icon=(name,x,y,size=.42,color='192333')=>slide.addImage({path:path.join(root,`public/icons/modern/${name}-${color}.png`),x,y,w:size,h:size});
 const semantic=v=>/ryzyk|bezpiec|dane|granic|praw|zgod/i.test(v)?'shield':/czas|minut|termin|tydzie/i.test(v)?'clock':/źród|szuk|research|sprawd|weryf/i.test(v)?'search':/wynik|mier|KPI|analiz|koszt/i.test(v)?'chart':/człow|osob|zesp|persona|klient/i.test(v)?'group':/cel|zadani|plan|priorytet/i.test(v)?'target':/pomysł|warto|kreac/i.test(v)?'lamp':/model|AI|GPT|Gem/i.test(v)?'ai':'document';
 const badge=(v,x,y,color=t.highlight)=>{dot(x,y,.5,.5,color);icon(semantic(v),x+.095,y+.095,.31);};
 const imageFile=(f,x,y,w,h,contain=false,round=false)=>{let file=path.join(root,'public/assets',f),dims=sizeOf(fs.readFileSync(file));slide.addImage({path:file,x,y,w:dims.width/96,h:dims.height/96,altText:round?'BUR_ROUND':'BUR_ASSET',sizing:{type:contain?'contain':'cover',w,h}});};
 if(d.backgroundImage){imageFile(d.backgroundImage,0,0,13.333,7.5);slide.addShape(p.ShapeType.rect,{x:0,y:0,w:13.333,h:7.5,line:{transparency:100},fill:{color:'FFFFFF',transparency:22}});}
 dot(11.7,.14,1.32,1.32,t.panel,5);dot(12.35,.65,.46,.46,t.highlight);dot(.12,6.55,.2,.2,t.accent);
 const rule=(x,y,w,color=accent)=>slide.addShape(p.ShapeType.line,{x,y,w,h:0,line:{color,width:1.4}});
 const tx=(v,x,y,w,h,size=24,color=fg,bold=false,font=t.font)=>{
  let text=wrapText(v,w,size,font,bold);
  for(let k=0;k<6&&text.split('\n').length*size*1.2>(h+0.05)*72&&size>20;k++){size-=1;text=wrapText(v,w,size,font,bold);}
  return slide.addText(text,{x,y,w:w+0.14,h:h+0.05,fontSize:size,fontFace:font,color,bold,margin:0,breakLine:false,valign:'mid',align:/^\d{2}$/.test(String(v))&&w<=1?'center':'left',paraSpaceAfter:0,fit:'shrink',isTextBox:true});
 };
 const pic=(x,y,w,h,contain=false)=>{if(s.image){rect(x-.055,y-.055,w+.11,h+.11,t.panel);imageFile(s.image,x,y,w,h,contain,true);}};
 const split=v=>{const [a,...b]=v.split('::');return[a,b.join('::')];};
 const footer=()=>{if(s.fullArt)rect(11.45,6.94,1.2,.4,"FFFFFF");rule(.65,6.86,12,t.panel);rule(.65,6.86,12*(index+1)/20,t.accent);tx(`AI EVOLUTION POLSKA   /   ${d.moduleId}`,0.65,7.02,9,0.2,11,accent,true,'Segoe UI');tx(`${String(index+1).padStart(2,'0')} / 20`,11.65,7.02,1.1,0.2,11,accent,false,'Segoe UI');};
 if(s.layout==='cover'){
  if(s.fullArt){imageFile(s.image,0,0,13.333,7.5);rect(.38,1.43,6.55,4.95,'FFFFFF');}
  else {dot(7.2,.45,5.65,5.65,t.panel);pic(7.4,.7,5.25,5.95);rect(8.05,5.65,3.95,.7,t.highlight);icon('group',8.27,5.81,.38);tx('AI w praktyce firmy',8.83,5.78,2.8,.4,17,t.fg,true,'Segoe UI');}
  rect(.65,.5,1.12,.5,t.highlight);tx(d.moduleId,.8,.5,.82,.5,20,t.fg,true,'Segoe UI');tx('WARSZTAT / AI EVOLUTION',2,.57,5,.3,12,t.accent,true,'Segoe UI');
  tx(s.title,.65,1.6,6.0,3.65,50,t.fg,true,t.font);
  rule(.65,5.45,1.2);tx(s.points.join('\n'),.65,5.65,6.0,.85,21,t.fg,false,'Segoe UI');
  footer();return;
 }
 rect(.65,.32,.42,.35,t.highlight);icon(semantic(s.title),.74,.38,.22);tx(s.kicker||'WIEDZA W PRAKTYCE',1.22,0.35,10.5,0.3,12,accent,true,'Segoe UI');
 tx(s.title,0.65,0.97,12.0,1.3,35,fg,true,t.font);
 const points=s.points,n=points.length;
 if(s.layout==='image'){
  const reverse=index%2===0;
  pic(reverse?0.65:6.75,2.55,5.9,3.85,s.imageFit==='contain');
  const x=reverse?7:0.65;
  points.forEach((v,j)=>{const[a,b]=split(v);badge(a,x,2.62+j*1.3);tx(a,x+.66,2.6+j*1.3,4.9,0.52,25,accent,true,'Segoe UI');if(b)tx(b,x,3.15+j*1.3,5.55,0.8,22,fg,false,'Segoe UI');});
 }else if(s.layout==='statement'){
  rect(.65,2.52,12,2.35,t.panel);dot(11.5,2.25,.86,.86,t.highlight);icon('lamp',11.7,2.45,.46);
  tx(points[0],0.95,2.65,s.image?7.1:10.8,2.02,38,accent,true,t.font);
  if(points[1]){badge(points[1],.85,5.45);tx(points[1],1.6,5.12,10.35,1.1,24,fg,false,'Segoe UI');}
  if(s.image)pic(9,2.7,3.4,2.7,true);
 }else if(s.layout==='process'||s.layout==='timeline'){
  const w=11.6/n;
  rule(0.95,3.2,10.85);
  points.forEach((v,j)=>{const x=0.8+j*w,[a,b]=split(v);rect(x-.1,3.68,w-.1,2.7,j%2?t.panel:'FFFFFF');dot(x,2.64,.95,.95,j%2?t.highlight:t.panel);icon(semantic(a),x+.23,2.87,.49);tx(String(j+1).padStart(2,'0'),x+1.12,2.82,.7,.5,20,accent,true,'Segoe UI');tx(a,x+.08,3.85,w-0.34,0.9,25,fg,true,'Segoe UI');if(b)tx(b,x+.08,4.94,w-0.36,1.12,21,fg,false,'Segoe UI');});
 }else if(s.layout==='comparison'){
  points.forEach((v,j)=>{const x=0.65+(j%2)*6.2,y=2.65+Math.floor(j/2)*1.82,[a,b]=split(v);rect(x,y,5.75,1.7,j%2?t.panel:'FFFFFF');badge(a,x+.12,y+.19);tx(a,x+.8,y+0.14,4.7,0.63,27,accent,true,'Segoe UI');if(b)tx(b,x+.18,y+0.82,5.3,0.8,23,fg,false,'Segoe UI');});
 }else if(s.layout==='exercise'){
  rect(.65,2.55,3.18,3.92,t.panel);dot(1.3,4.93,1.6,1.1,t.highlight);
  tx(`${s.activityMinutes} min`,0.85,2.65,2.8,1,42,accent,true,'Segoe UI');
  tx(s.exerciseLabel||'PRACA WŁASNA',0.7,3.9,3.0,1,21,fg,true,'Segoe UI');
  icon('target',1.75,5.12,.64);
  points.forEach((v,j)=>{const[a,b]=split(v),y=2.65+j*1.02;rect(4.15,y-.04,8.5,.94,'FFFFFF');dot(4.3,y+.12,.52,.52,t.highlight);tx(`${j+1}`,4.44,y+.13,.23,.45,20,accent,true,'Segoe UI');tx(b?`${a}: ${b}`:a,5.02,y,7.3,0.83,24,fg,false,'Segoe UI');});
 }else if(s.layout==='anatomy'){
  points.forEach((v,j)=>{const[a,b]=split(v),y=2.62+j*0.98;rect(.65,y,12,.85,j%2?'FFFFFF':t.panel);badge(a,.78,y+.17);tx(a,1.45,y,2.25,0.82,22,accent,true,'Segoe UI');tx(b||a,4.0,y,8.4,0.82,24,fg,false,'Segoe UI');});
 }else if(s.layout==='evidence'||s.layout==='case'){
  const[a,b]=split(points[0]);
  rect(0.65,2.65,5.0,3.82,t.panel);badge(a,.95,2.92);tx(a,1.65,2.88,3.7,0.75,24,t.accent,true,'Segoe UI');tx(b||a,0.95,3.86,4.35,2.2,30,t.fg,false,t.font);
  points.slice(1).forEach((v,j)=>{const[c,e]=split(v),y=2.65+j*1.25;badge(c,6.05,y);tx(c,6.76,y,5.7,0.47,24,accent,true,'Segoe UI');tx(e||'',6.15,y+0.5,6.4,0.8,22,fg,false,'Segoe UI');});
 }else if(s.layout==='decision'){
  const[a,b]=split(points[0]);rect(3.05,2.55,7.2,1.08,t.panel);tx(b?`${a}: ${b}`:a,3.3,2.6,6.7,0.95,27,fg,true,'Segoe UI');
  slide.addShape(p.ShapeType.line,{x:6.65,y:3.64,w:0,h:.32,line:{color:accent,width:1.5}});
  const w=11.9/Math.max(1,n-1);points.slice(1).forEach((v,j)=>{const[c,e]=split(v),x=0.7+j*w;slide.addShape(p.ShapeType.line,{x:Math.min(6.65,x+w/2),y:3.94,w:Math.abs(x+w/2-6.65),h:0,line:{color:accent,width:1.5}});rect(x,4.2,w-.25,2.22,j%2?t.panel:'FFFFFF');badge(c,x+.12,4.34);tx(c,x+.78,4.28,w-1.1,0.65,26,accent,true,'Segoe UI');tx(e||'',x+.16,5.1,w-.55,1.12,23,fg,false,'Segoe UI');});
 }else if(s.layout==='matrix'){
  points.forEach((v,j)=>{const[a,b]=split(v),y=2.65+j*0.94;rect(.65,y,12,.85,j%2?'FFFFFF':t.panel);badge(a,.78,y+.18);tx(a,1.43,y+.04,3.0,0.8,23,accent,true,'Segoe UI');tx(b||'',4.75,y+.04,7.65,0.8,23,fg,false,'Segoe UI');});
 }else{
  points.forEach((v,j)=>{const[a,b]=split(v),y=2.65+j*(3.8/n);rect(.65,y-.04,12,3.8/n-.08,j%2?'FFFFFF':t.panel);badge(a,.82,y+.15);tx(a,1.6,y,4.0,0.82,25,fg,true,'Segoe UI');if(b)tx(b,5.9,y,6.4,0.9,23,fg,false,'Segoe UI');});
 }
 footer();
}
