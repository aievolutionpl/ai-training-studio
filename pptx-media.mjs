import {createHash} from 'node:crypto';
// Reuse identical embedded bytes; all drawing relationships remain editable.
export async function deduplicateMedia(zip){
 const seen=new Map(),aliases=new Map();
 for(const name of Object.keys(zip.files).filter(n=>n.startsWith('ppt/media/')&&!zip.files[n].dir)){
  const bytes=await zip.file(name).async('nodebuffer'),hash=createHash('sha256').update(bytes).digest('hex');
  if(seen.has(hash)){aliases.set(name.slice(10),seen.get(hash).slice(10));zip.remove(name);}else seen.set(hash,name);
 }
 for(const name of Object.keys(zip.files).filter(n=>n.endsWith('.rels'))){
  let xml=await zip.file(name).async('string');
  xml=xml.replace(/Target="\.\.\/media\/([^"]+)"/g,(all,file)=>aliases.has(file)?`Target="../media/${aliases.get(file)}"`:all);
  zip.file(name,xml);
 }
 return zip;
}
