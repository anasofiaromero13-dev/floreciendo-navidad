import {createDecipheriv, createHash} from 'node:crypto';

const mailbox = 'donaciones@floreciendoconamor.org';

export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST') return res.status(405).end();
 const authorization=req.headers.authorization;
 if(!authorization) return res.status(403).send('Acceso exclusivo del equipo.');
 try {
  const grant=await fetch('https://hmogxgyjpyxxosmaonot.supabase.co/rest/v1/rpc/campaign_gmail_grant',{
   method:'POST',headers:{authorization,apikey:'sb_publishable_bqRmNvombSdtrST6HM8cRA_vTPPwNZ5','Content-Type':'application/json'},body:'{}'
  });
  if(!grant.ok) return res.status(403).send('Acceso exclusivo del equipo.');
  const encrypted=await grant.json();
  if(!encrypted) return res.status(409).send('Conecta Gmail primero.');
  const secret=process.env.GOOGLE_CLIENT_SECRET;
  const bytes=Buffer.from(encrypted,'base64url');
  const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update('gmail-grant:'+secret).digest(),bytes.subarray(0,12));
  decipher.setAuthTag(bytes.subarray(12,28));
  const refreshToken=Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');
  const exchange=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({
   client_id:process.env.GOOGLE_CLIENT_ID,client_secret:secret,grant_type:'refresh_token',refresh_token:refreshToken
  })});
  if(!exchange.ok) throw Error();
  const {access_token}=await exchange.json();
  const subject=Buffer.from('Prueba de correo · Floreciendo Navidad').toString('base64');
  const raw=Buffer.from([
   'From: Floreciendo con Amor <'+mailbox+'>','To: '+mailbox,'Reply-To: '+mailbox,
   'Subject: =?UTF-8?B?'+subject+'?=','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8',
   '', 'Este correo comprueba el envío desde la app de apadrinamiento. Al responder, la respuesta llegará al buzón de donaciones.'
  ].join('\r\n')).toString('base64url');
  const sent=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
   method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json'},body:JSON.stringify({raw})
  });
  if(!sent.ok) throw Error();
  return res.json({sent:true});
 } catch {
  return res.status(502).send('No pudimos enviar el correo de prueba.');
 }
}
