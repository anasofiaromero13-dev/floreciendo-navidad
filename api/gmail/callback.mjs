import {createHash, randomBytes, createCipheriv} from 'node:crypto';

const callback = 'https://floreciendo-navidad.vercel.app/api/gmail/callback';
const mailbox = 'donaciones@floreciendoconamor.org';
const scope = 'https://www.googleapis.com/auth/gmail.send';
const base = 'https://hmogxgyjpyxxosmaonot.supabase.co';
const key = 'sb_publishable_bqRmNvombSdtrST6HM8cRA_vTPPwNZ5';

export default async function handler(req, res) {
 res.setHeader('Cache-Control', 'no-store');
 res.setHeader('Referrer-Policy', 'no-referrer');
 const client = process.env.GOOGLE_CLIENT_ID;
 const secret = process.env.GOOGLE_CLIENT_SECRET;
 if (!client || !secret) return res.status(503).send('Faltan las credenciales de Google en Vercel.');
 try {
  if (req.method === 'POST') {
   const staff = await fetch(base+'/rest/v1/rpc/current_user_is_staff', {
    method:'POST', headers:{apikey:key,authorization:req.headers.authorization || '', 'Content-Type':'application/json'}, body:'{}'
   });
   if (!staff.ok || await staff.json() !== true) return res.status(403).send('Acceso exclusivo del equipo.');
   if (req.body?.code) return await finish(req,res,client,secret);
   const state=randomBytes(32).toString('base64url');
   res.setHeader('Set-Cookie', '__Host-gmail-state='+state+'; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax');
   const params=new URLSearchParams({client_id:client,redirect_uri:callback,response_type:'code',scope:scope+' openid email',access_type:'offline',prompt:'consent',login_hint:mailbox,state});
   return res.json({url:'https://accounts.google.com/o/oauth2/v2/auth?'+params});
  }
  if (req.method !== 'GET') return res.status(405).end();
  const params=new URLSearchParams();
  for (const field of ['code','state','error']) {
   if (typeof req.query[field]==='string') params.set(field,req.query[field]);
  }
  return res.redirect(303,'/#gmail-return&'+params);
 } catch {
  return res.status(502).send('No se completó la conexión. Vuelve a intentarlo desde el portal del equipo.');
 }
}

async function finish(req,res,client,secret) {
  const state=req.headers.cookie?.match(/(?:^|;\s*)__Host-gmail-state=([\w-]+)/)?.[1];
  res.setHeader('Set-Cookie','__Host-gmail-state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax');
  if (!state || req.body.state!==state || typeof req.body.code!=='string') return res.status(400).send('Vuelve al portal del equipo y pulsa Conectar Gmail.');
  const exchange=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:client,client_secret:secret,code:req.body.code,redirect_uri:callback,grant_type:'authorization_code'})});
  if (!exchange.ok) throw Error();
  const token=await exchange.json();
  const identity=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token.access_token}});
  if (!identity.ok) throw Error();
  const profile=await identity.json();
  if (profile.email!==mailbox || profile.email_verified!==true) return res.status(403).send('Autoriza con el buzÃ³n de donaciones de la fundaciÃ³n.');
  if (!token.refresh_token || !token.scope?.split(' ').includes(scope)) throw Error();
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',createHash('sha256').update('gmail-grant:'+secret).digest(),iv);
  const encrypted=Buffer.concat([cipher.update(token.refresh_token,'utf8'),cipher.final()]);
  const grant=Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
  const saved=await fetch(base+'/rest/v1/rpc/campaign_save_gmail',{
   method:'POST',headers:{apikey:key,Authorization:req.headers.authorization,'Content-Type':'application/json'},
   body:JSON.stringify({p_grant:grant})
  });
  if (!saved.ok) throw Error();
  return res.json({connected:true});
}
