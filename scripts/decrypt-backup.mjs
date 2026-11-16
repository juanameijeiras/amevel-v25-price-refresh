import{readFileSync,writeFileSync}from'node:fs';import{privateDecrypt,createDecipheriv,constants}from'node:crypto';
const args=process.argv.slice(2),arg=name=>args[args.indexOf(name)+1];
if(!args.includes('--backup')||!args.includes('--key')||!args.includes('--out'))throw Error('Use --backup encrypted.json --key local-private-key.pem --out recovered.json');
const e=JSON.parse(readFileSync(arg('--backup'),'utf8'));if(e.version!==1||e.algorithm!=='AES-256-GCM+RSA-OAEP-SHA256')throw Error('Unexpected backup format');
const key=privateDecrypt({key:readFileSync(arg('--key')),padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(e.encryptedKey,'base64'));
const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(e.iv,'base64'));decipher.setAuthTag(Buffer.from(e.tag,'base64'));
const data=Buffer.concat([decipher.update(Buffer.from(e.data,'base64')),decipher.final()]);JSON.parse(data.toString());
writeFileSync(arg('--out'),data,{mode:0o600,flag:'wx'});console.log('Recovered locally. No Shopify write was performed.');
