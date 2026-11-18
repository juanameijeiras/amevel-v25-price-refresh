import {createHash} from 'node:crypto';
import {THEME,HOST,ensureTheme,REFERENCES,validateReference} from './reference-plan.mjs';
export const STARTING='assets/amevel-v25-starting-prices.json';
const hash=s=>createHash('sha256').update(s).digest('hex');
const assert=(x,m)=>{if(!x)throw Error(m)};
export function readStarting(theme){
 ensureTheme(theme);const body=theme.files.nodes.find(x=>x.filename===STARTING)?.body.content;assert(typeof body==='string','Missing shared starting prices');const data=JSON.parse(body);
 assert(data.version===1&&data.themeId==='204653822279'&&data.maxAgeHours===48&&Array.isArray(data.configurations)&&data.configurations.length===13,'Starting inventory changed');
 const seen=new Set();for(const c of data.configurations){assert(['sttark','avco','brandmybags'].includes(c.route)&&c.input.themeId===data.themeId&&c.input.product===c.handle&&/^[a-z0-9-]+$/.test(c.handle)&&!seen.has(c.handle)&&Number.isSafeInteger(c.input.quantity)&&c.input.quantity>0&&c.input.quantity<=1000000,'Invalid starting configuration');seen.add(c.handle);}
 return{body,data};
}
export async function fetchStarting(theme,fetcher=fetch){
 const {data}=readStarting(theme),responses={};
 // Sequential to respect supplier limits. No credentials and no quote submissions.
 for(const c of data.configurations){try{const r=await fetcher(HOST+'/api/pricing/'+c.route,{method:'POST',headers:{Origin:'https://amevel.com','Content-Type':'application/json'},body:JSON.stringify(c.input),signal:AbortSignal.timeout(25000)});assert(r.ok,'Pricing HTTP '+r.status);responses[c.handle]=await r.json();}catch{responses[c.handle]={error:'Pricing unavailable'};}}
 return responses;
}
export function startingPlan(theme,responses,ingredients,now=new Date()){
 const {body,data}=readStarting(theme),updated=[],retained=[];
 for(const c of data.configurations){try{const r=responses[c.handle];assert(r?.status==='estimate'&&r.currency==='USD'&&Number.isSafeInteger(r.totalCents)&&r.totalCents>0&&r.totalCents<=1000000000&&r.quantity===c.input.quantity&&Date.parse(r.expiresAt)>now.getTime(),'Unverified price');c.price={totalCents:r.totalCents,centsPerUnit:r.totalCents/r.quantity,checkedAt:now.toISOString(),unit:c.unit,handle:c.handle};updated.push(c.handle);}catch{retained.push({key:c.handle,reason:'Unverified price; previous timestamp retained'});}}
 data.ingredients ||= {};
 for(const [family,product] of REFERENCES){const category=family==='dairy'?'powders-concentrates':family==='coffee'?'coffee':'cacao';const list=data.ingredients[category] ||= [];
 try{const info=validateReference(family,product,ingredients[family+':'+product],now),value={handle:product,centsPerUnit:info.low/50,unit:'lb',checkedAt:now.toISOString()};const i=list.findIndex(x=>x.handle===product);if(i<0)list.push(value);else list[i]=value;updated.push(product);}catch{retained.push({key:product,reason:'Unverified ingredient; previous timestamp retained'});}}
 const after=JSON.stringify(data,null,2)+'\n';return{themeId:THEME,themeRole:theme.role,filename:STARTING,body:after,beforeSha256:hash(body),afterSha256:hash(after),changed:after!==body,checkedAt:now.toISOString(),updated,unchanged:[],retained};
}
