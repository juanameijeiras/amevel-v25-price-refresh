import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export const THEME='gid://shopify/OnlineStoreTheme/204653822279';
export const SNAPSHOT='snippets/amevel-v25-ingredient-stored-reference.liquid';
export const HOST='https://amevel-configurator-ba5bhz0sm-juan-ameijeiras-projects.vercel.app';
export const REFERENCES=[['dairy','whole-milk'],['dairy','skim-milk'],['dairy','whey-powder'],['dairy','amf'],['cocoa-index','terranova-cocoa-powder'],['cocoa-index','evergrove-cocoa-powder'],['cocoa-index','sunridge-cocoa-powder'],['coffee','arabica-classic']];
const DAY=86400000,sha=x=>createHash('sha256').update(x).digest('hex');
const integer=n=>Number.isSafeInteger(n)&&n>0;
const positive=n=>Number.isFinite(n)&&n>0;
const ceil=n=>Math.ceil(Number(n.toFixed(6)));
const dayOf=d=>d.toISOString().slice(0,10);
const midnight=d=>Date.parse(dayOf(d)+'T00:00:00Z');
const dayDate=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('invalid source date');const t=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(t)||dayOf(new Date(t))!==s)throw Error('invalid source date');return t;};
const assert=(yes,why)=>{if(!yes)throw Error(why);};
export function ensureTheme(theme){assert(theme?.id===THEME&&theme.role==='UNPUBLISHED','Only unpublished V2.5 may be refreshed');assert(Array.isArray(theme.files?.nodes),'Missing fresh remote files');}
export function validateReference(family,product,data,now){
 assert(data?.product===product&&data.currency==='USD'&&data.packKg===1&&data.bags===1,'Mismatched reference identity or units');
 const checked=Date.parse(data.referenceCheckedAt);assert(Number.isFinite(checked)&&checked<=now.getTime()+60000&&dayOf(new Date(checked))===dayOf(now),'Reference was not checked today');
 assert(Date.parse(data.expiresAt)>now.getTime(),'Expired API response');
 const c=data.calculation;assert(c,'Missing versioned formula');let validUntil;
 if(family==='dairy'){
  assert(data.status==='indicative_range'&&c.method==='dairy-order-v1'&&positive(c.lowUsdPerKg)&&positive(c.highUsdPerKg)&&c.lowUsdPerKg<=c.highUsdPerKg,'Invalid dairy basis');
  const reports={'whole-milk':['1036','1039'],'skim-milk':['1035','1038'],'whey-powder':['1034'],'amf':['gdt-amf']}[product];assert(Array.isArray(data.sources)&&data.sources.length===reports.length,'Unexpected dairy sources');
  validUntil=Math.min(...data.sources.map((s,i)=>{const d=dayDate(s.reportDate),age=(midnight(now)-d)/DAY;assert(age>=0&&age<=21,'Dairy source outside existing age limit');
   assert(s.url===(product==='amf'?'https://www.globaldairytrade.info/en/product-results/anhydrous-milk-fat':'https://mymarketnews.ams.usda.gov/viewReport/'+reports[i]),'Unexpected dairy source URL');
   assert(product==='amf'?s.market==='Global Dairy Trade':['Europe','Oceania'].includes(s.market),'Unexpected dairy market');
   if(s.publishedDate!=null){const published=dayDate(s.publishedDate);assert(published>=d&&published<=midnight(now),'Invalid publication date');}else assert(product==='amf','Missing publication date');
   return d+22*DAY;}));
  for(const [field,value]of Object.entries({lowPackCents:ceil(c.lowUsdPerKg/.70*100),highPackCents:ceil(c.highUsdPerKg/.70*100)}))assert(data[field]===value,'API formula changed');
  assert(data.lowTotalCents===data.lowPackCents&&data.highTotalCents===data.highPackCents,'Invalid base totals');
 }else{
  assert(/^\d{4}(0[1-9]|1[0-2])$/.test(data.period)&&data.sourceUrl==='https://apps.fas.usda.gov/gats/','Unexpected monthly source');
  const first=Date.UTC(+data.period.slice(0,4),+data.period.slice(4)-1,1),end=Date.UTC(+data.period.slice(0,4),+data.period.slice(4),0),published=dayDate(data.publishedDate);
  assert(published>first&&published<=midnight(now)&&now.getTime()-end<=120*DAY,'Monthly source outside existing age limit');validUntil=end+120*DAY;
  assert(positive(c.usdPerKg),'Invalid reference rate');
  if(family==='coffee')assert(data.status==='indicative_proxy'&&c.method==='coffee-pack-v1'&&data.referenceCountry==='CO'&&data.referenceForm==='roasted_arabica_retail_le_2kg'&&data.referenceHs10==='0901210020'&&data.grossMarginPercent===30,'Coffee formula or source changed');
  else assert(data.status==='indicative_indexed'&&c.method==='cocoa-order-v1'&&data.baselinePeriod==='202604'&&data.period>=data.baselinePeriod&&Number.isFinite(data.benchmarkChangePercent)&&data.benchmarkChangePercent>-100,'Cocoa formula or source changed');
  const base=family==='coffee'?Math.round(c.usdPerKg*100):ceil(c.usdPerKg*100);assert(data.packCents===base&&data.totalCents===base,'API base formula changed');
 }
 const kg=22.6796185;const low=family==='dairy'?ceil(c.lowUsdPerKg*kg/.70*100):family==='coffee'?Math.round(c.usdPerKg*kg*100):ceil(c.usdPerKg*kg*100);
 const high=family==='dairy'?ceil(c.highUsdPerKg*kg/.70*100):low;assert(integer(low)&&integer(high),'Invalid pack display');
 return{checked:Math.floor(checked/1000),validUntil:Math.floor(validUntil/1000),low,high};
}
const canonical=d=>JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k])=>k!=='expiresAt').sort(([a],[b])=>a.localeCompare(b))));
export function planRefresh(theme,responses,now=new Date()){
 ensureTheme(theme);const file=theme.files.nodes.find(x=>x.filename===SNAPSHOT);assert(typeof file?.body?.content==='string','Missing stored-reference snippet');
 const before=file.body.content;assert(before.includes('theme.id == 204653822279')&&before.includes('reference_age <= 172800'),'Snapshot guards changed; review required');
 const keys=[...before.matchAll(/{% when '([^']+)' %}/g)].map(x=>x[1]);assert(JSON.stringify(keys)===JSON.stringify(REFERENCES.map(x=>x.join(':'))),'Reference inventory changed; review required');
 let after=before;const updated=[],retained=[],unchanged=[];
 for(const [family,product]of REFERENCES){const key=family+':'+product;const blockPattern=new RegExp("(\\{% when '"+key+"' %\\})([\\s\\S]*?)(?=\\{% (?:when |endcase))");const block=after.match(blockPattern);assert(block,'Missing reference case');
  try{
   const raw=responses[key];assert(raw&&!raw.error,raw?.error||'Missing source response');const old=JSON.parse(block[2].match(/{% capture cached_json %}([\s\S]*?){% endcapture %}/)[1]);
   // Retain only established public response fields; never archive arbitrary new response data.
   const data=Object.fromEntries(Object.keys(old).filter(k=>Object.hasOwn(raw,k)).map(k=>[k,raw[k]]));const info=validateReference(family,product,data,now);
   if(canonical(old)===canonical(data)){unchanged.push(key);continue;}
   let next=block[2];const replace=(pattern,value)=>{assert((next.match(new RegExp(pattern.source,'g'))||[]).length===1,'Snapshot structure changed');next=next.replace(pattern,value);};
   replace(/{% assign cached_at = \d+ %}/,'{% assign cached_at = '+info.checked+' %}');replace(/{% assign source_valid_until = \d+ %}/,'{% assign source_valid_until = '+info.validUntil+' %}');
   replace(/{% capture cached_json %}[\s\S]*?{% endcapture %}/,'{% capture cached_json %}'+JSON.stringify(data).replace(/</g,'\\u003c')+'{% endcapture %}');
   replace(/{% assign stored_low_cents = \d+ %}/,'{% assign stored_low_cents = '+info.low+' %}');replace(/{% assign stored_high_cents = \d+ %}/,'{% assign stored_high_cents = '+info.high+' %}');
   replace(/{% assign cached_day = '[^']+' %}/,"{% assign cached_day = '"+dayOf(new Date(data.referenceCheckedAt))+"' %}");
   after=after.replace(blockPattern,()=>block[1]+next);updated.push(key);
  }catch(error){retained.push({key,reason:String(error.message)});}
 }
 return{themeId:THEME,filename:SNAPSHOT,checkedAt:now.toISOString(),beforeSha256:sha(before),afterSha256:sha(after),changed:after!==before,updated,unchanged,retained,body:after};
}
export async function fetchReferences(theme,fetcher=fetch){
 ensureTheme(theme);
 for(const family of ['dairy','coffee','cocoa-index']){const f=theme.files.nodes.find(x=>x.filename==='snippets/amevel-v25-'+(family==='dairy'?'dairy-pricing':family==='coffee'?'coffee-pricing':'cocoa-index')+'.liquid');assert(f?.body.content.includes('data-endpoint="'+HOST+'/api/pricing/'+family+'"'),'Preview endpoint changed; review required');}
 const responses={};for(const [family,product]of REFERENCES){const key=family+':'+product;try{
  const response=await fetcher(HOST+'/api/pricing/'+family,{method:'POST',headers:{Origin:'https://amevel.com','Content-Type':'application/json'},body:JSON.stringify({themeId:'204653822279',product,packKg:1,bags:1}),signal:AbortSignal.timeout(35000)});
  assert(response.ok,'Pricing HTTP '+response.status);responses[key]=await response.json();
 }catch(error){responses[key]={error:String(error.message)}}}return responses;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const args=process.argv.slice(2),arg=name=>args[args.indexOf(name)+1];assert(args.includes('--baseline')&&args.includes('--out'),'Use --baseline fresh-theme.json --out audit-directory');
 const theme=JSON.parse(readFileSync(resolve(arg('--baseline')),'utf8'));ensureTheme(theme);const out=resolve(arg('--out'));mkdirSync(out,{recursive:true});
 const current=theme.files.nodes.find(x=>x.filename===SNAPSHOT);assert(current,'Missing current snapshot');writeFileSync(join(out,'before.liquid'),current.body.content);
 const responses=await fetchReferences(theme);writeFileSync(join(out,'public-responses.json'),JSON.stringify(responses,null,2));const plan=planRefresh(theme,responses);writeFileSync(join(out,'candidate.liquid'),plan.body);
 const{body,...report}=plan;writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));if(plan.changed)writeFileSync(join(out,'upload.json'),JSON.stringify({themeId:THEME,files:[{filename:SNAPSHOT,body:{type:'TEXT',value:body}}]}));
 console.log(JSON.stringify(report));if(plan.retained.length)process.exitCode=2;
}
