import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {existsSync} from 'node:fs';
import {moduleScene,validateScene,assetFile,exportScene,catalog} from './visual-editor.mjs';
const fixture=()=>({format:'aievo-visual-v1',moduleId:'M01',title:'Editor test',slides:[{notes:'Trainer notes',canvas:{background:'#ffffff',objects:[{type:'Textbox',text:'Test',left:60,top:60,width:400,height:80,fontSize:36,fill:'#192333'},{type:'Image',src:'/icons/modern/ai-192333.png',left:60,top:180,width:100,height:100,scaleX:1,scaleY:1}]}}]});
test('visual editor converts all 280 existing slides to editable native elements',{skip:!existsSync(new URL('./projects/bur-2026-09-09/M01/deck.json',import.meta.url))},async()=>{
 for(let n=1;n<=14;n++){const d=await moduleScene('M'+String(n).padStart(2,'0'));validateScene(d);assert.equal(d.slides.length,20);assert.ok(d.slides.every(s=>s.canvas.objects.some(o=>o.type==='Textbox')));}
 assert.ok((await catalog()).length>30);
});
test('visual editor preserves edited text, notes and images in PowerPoint',async()=>{
 const d=fixture();d.slides[0].canvas.objects.find(o=>o.type==='Textbox').text='Edytowalny wynik testu';
 const z=await JSZip.loadAsync(await exportScene(d));const xml=await z.file('ppt/slides/slide1.xml').async('string');assert.match(xml,/Edytowalny wynik testu/);assert.match(xml,/<p:pic>/);assert.ok(z.file('ppt/notesSlides/notesSlide1.xml'));
});
test('editor rejects arbitrary file paths and unsupported imported objects',async()=>{
 assert.throws(()=>assetFile('/assets/../../secret.png'));assert.throws(()=>assetFile('https://example.com/pic.png'));
 const d=fixture();d.slides[0].canvas.objects.push({type:'Group'});assert.throws(()=>validateScene(d));
});
