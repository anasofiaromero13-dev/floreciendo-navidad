const URL_BASE=Deno.env.get('SUPABASE_URL')!;
const ADMIN=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE='https://floreciendo-navidad.vercel.app';
const encoder=new TextEncoder();
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
function random(){return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function call(path:string,body?:unknown,method='POST',token=ADMIN,extra:Record<string,string>={}){
 const r=await fetch(URL_BASE+path,{method,headers:{apikey:ADMIN,Authorization:'Bearer '+token,'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data:any;try{data=text?JSON.parse(text):null}catch{data=null}
 if(!r.ok)throw Error(data?.msg||data?.message||data?.error_description||'No pudimos completar el acceso.');
 return data;
}
async function signIn(email:string,password:string){return await call('/auth/v1/token?grant_type=password',{email,password})}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':SITE,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Content-Type':'application/json'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({message:'Método no permitido'},405);
 if(origin&&origin!==SITE)return reply({message:'Origen no permitido'},403);
 try{
  if(Number(req.headers.get('content-length')||0)>8192)return reply({message:'Solicitud demasiado grande'},413);
  const body=await req.json();
  const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')||'unknown';
  const ok=await call('/rest/v1/rpc/consume_access_budget',{p_hash:await hash(ip),p_hour:Math.floor(Date.now()/3600000)});
  if(!ok)return reply({message:'Has realizado varios intentos. Intenta más tarde o contacta a la fundación.'},429);
  if(body.action==='register'){
   const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
   if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128)return reply({message:'Usa un correo válido y una contraseña de al menos 12 caracteres.'},400);
   if(email.split('@')[1]==='floreciendoconamor.org')return reply({message:'Los correos de la fundación ingresan desde Acceso del equipo, con su invitación privada.'},403);
   const bearer=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
   let existing:any=null;
   if(bearer){try{existing=await call('/auth/v1/user',undefined,'GET',bearer)}catch{return reply({message:'Tu sesión terminó. Vuelve a ingresar.'},401)}}
   if(existing){
    if(existing.app_metadata?.campaign_guest!==true)return reply({message:'Tu cuenta ya está creada. Ingresa con tu correo y contraseña.'},409);
    await call('/auth/v1/admin/users/'+existing.id,{email,password,email_confirm:true,app_metadata:{...existing.app_metadata,campaign_guest:false,campaign_account:true,contact_email:email}},'PUT');
   }else{
    try{await call('/auth/v1/admin/users',{email,password,email_confirm:true,app_metadata:{campaign_account:true,contact_email:email}})}
    catch{return reply({message:'No pudimos crear la cuenta. Si ya te registraste con ese correo, elige Iniciar sesión.'},409)}
   }
   return reply({session:await signIn(email,password)});
  }
  if(body.action==='guest'){
   const contact=String(body.email||'').trim().toLowerCase();
   if(contact.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))return reply({message:'Revisa tu correo de contacto.'},400);
   const id=crypto.randomUUID(),password=random(),email='guest-'+id+'@access.floreciendoconamor.invalid';
   await call('/auth/v1/admin/users',{email,password,email_confirm:true,app_metadata:{campaign_guest:true,contact_email:contact}});
   const session=await signIn(email,password);
   return reply({session,key:id+'.'+password});
  }
  if(body.action==='guest-login'){
   const key=String(body.key||'');
   if(!/^[0-9a-f-]{36}\.[0-9a-f]{64}$/.test(key))return reply({message:'El enlace no es válido.'},400);
   const [id,password]=key.split('.');
   const session=await signIn('guest-'+id+'@access.floreciendoconamor.invalid',password);
   return reply({session});
  }
  if(body.action==='staff-enroll'){
   const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),token=String(body.token||'');
   if(!/^[^\s@]+@floreciendoconamor\.org$/.test(email)||password.length<12||password.length>128||!/^[0-9a-f]{64}$/.test(token))return reply({message:'Usa tu correo de la fundación y una contraseña de al menos 12 caracteres.'},400);
   const digest=await hash(token);
   const rows=await call('/rest/v1/staff_invites?token_hash=eq.'+digest+'&email=eq.'+encodeURIComponent(email)+'&used_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=token_hash',undefined,'GET');
   if(!rows?.length)return reply({message:'La invitación no es válida o ya fue usada. Solicita otra al equipo.'},403);
   const taken=await call('/rest/v1/staff_invites?token_hash=eq.'+digest+'&used_at=is.null',{used_at:new Date().toISOString()},'PATCH',ADMIN,{Prefer:'return=representation'});
   if(taken?.length!==1)return reply({message:'La invitación ya fue usada.'},409);
   try{await call('/auth/v1/admin/users',{email,password,email_confirm:true,app_metadata:{staff_invited:true}})}
   catch(error){await call('/rest/v1/staff_invites?token_hash=eq.'+digest,{used_at:null},'PATCH');throw error}
   return reply({session:await signIn(email,password)});
  }
  if(body.action==='staff-invite'){
   const bearer=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
   const u=await call('/auth/v1/user',undefined,'GET',bearer);
   if(!u?.id||!(await call('/rest/v1/rpc/current_user_is_staff',{},'POST',bearer)))return reply({message:'Acceso exclusivo del equipo.'},403);
   const email=String(body.email||'').trim().toLowerCase();
   if(!/^[^\s@]+@floreciendoconamor\.org$/.test(email))return reply({message:'Usa un correo de la fundación.'},400);
   const token=random();
   await call('/rest/v1/staff_invites',{token_hash:await hash(token),email,expires_at:new Date(Date.now()+7*86400000).toISOString()});
   return reply({url:SITE+'/#equipo='+token,email});
  }
  return reply({message:'Acción no permitida.'},400);
 }catch(error){console.error('Campaign access error',error instanceof Error?error.message:'unknown');return reply({message:'No pudimos completar el acceso. Revisa tus datos o contacta a la fundación.'},400)}
});
