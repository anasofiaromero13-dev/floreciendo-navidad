import crypto from 'node:crypto';
const BASE='https://hmogxgyjpyxxosmaonot.supabase.co',KEY='sb_publishable_bqRmNvombSdtrST6HM8cRA_vTPPwNZ5';
let input='';for await(const c of process.stdin)input+=c;const {token,email}=JSON.parse(input);
let bearer='';const ids={};
async function request(path,body,method='POST',headers={}){const r=await fetch(BASE+path,{method,headers:{apikey:KEY,'Content-Type':'application/json',...(bearer?{Authorization:'Bearer '+bearer}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(path+': '+(data?.message||r.status));return data}
const edge=body=>request('/functions/v1/campaign-access',body);
try{
const enrolled=await edge({action:'staff-enroll',email,token,password:'Qa!'+crypto.randomBytes(24).toString('hex')});
bearer=enrolled.session.access_token;ids.staffUser=enrolled.session.user.id;
if(!(await request('/rest/v1/rpc/current_user_is_staff',{})))throw Error('Staff role missing');
let reused=false;try{await edge({action:'staff-enroll',email,token,password:'Qa!'+crypto.randomBytes(24).toString('hex')})}catch{reused=true}if(!reused)throw Error('Invite was reusable');
const campaign=await request('/rest/v1/campaigns',{slug:'qa-'+crypto.randomUUID(),title:'Prueba técnica temporal',deadline:'2026-12-09T23:59:59-05:00',active:true,accepting_sponsorships:true},'POST',{Prefer:'return=representation'});ids.campaign=campaign[0].id;
const child=await request('/rest/v1/children?select=id',{campaign_id:ids.campaign,code:'QA',display_name:'Perfil técnico temporal',published:true},'POST',{Prefer:'return=representation'});ids.child=child[0].id;
await request('/rest/v1/children?id=eq.'+ids.child,{clothing_size:'16'},'PATCH');
await request('/rest/v1/gift_ideas',{child_id:ids.child,ideas:[{title:'Sugerencia de prueba'}]});
const staffToken=bearer;
const guest=await edge({action:'guest',email:'qa-function@example.invalid'});ids.guestUser=guest.session.user.id;bearer=guest.session.access_token;
await request('/rest/v1/rpc/claim_gift',{p_child:ids.child,p_parts:['toy'],p_name:'QA Backend temporal',p_phone:'0000000000',p_city:'Bogotá',p_delivery:'PRUEBA SIN ENTREGA'});
await request('/rest/v1/sponsor_profiles?user_id=eq.'+ids.guestUser,{contact_email:'qa-function@example.invalid'},'PATCH');
const ideas=await request('/rest/v1/gift_ideas?child_id=eq.'+ids.child,undefined,'GET');if(ideas.length!==1)throw Error('Owned ideas inaccessible');
const claims=await request('/rest/v1/sponsorships?child_id=eq.'+ids.child,undefined,'GET');ids.claim=claims[0].id;
await request('/rest/v1/rpc/change_gift',{p_id:ids.claim,p_action:'purchased'});
const d=await request('/rest/v1/donations',{campaign_id:ids.campaign,user_id:ids.guestUser,amount_cop:1,transfer_reference:'QA_NO_TRANSFER',donor_name:'QA Backend temporal',donor_email:'qa-function@example.invalid'},'POST',{Prefer:'return=representation'});ids.donation=d[0].id;
bearer=staffToken;
await request('/rest/v1/rpc/verify_donation',{p_id:ids.donation,p_verified:true});
const donations=await request('/rest/v1/donations?id=eq.'+ids.donation,undefined,'GET');if(!donations[0].verified_at)throw Error('Donation verification failed');
await request('/rest/v1/rpc/receive_gift',{p_id:ids.claim,p_received:true,p_distributed:false});
const pending=await request('/rest/v1/sponsorships?id=eq.'+ids.claim,undefined,'GET');if(!pending[0].staff_received_at)throw Error('Gift receipt failed');
bearer=guest.session.access_token;
const owned=await request('/rest/v1/sponsor_profiles?select=user_id',undefined,'GET');if(owned.some(r=>r.user_id!==ids.guestUser))throw Error('Profile isolation failed');
const restored=await edge({action:'guest-login',key:guest.key});if(restored.session.user.id!==ids.guestUser)throw Error('Guest restore failed');
console.log(JSON.stringify({ok:true,checks:['staff invite','one-time invite','staff role','profile edit','guest sponsorship','private suggestions','gift status','donation registration','donation verification','gift receipt','profile isolation','guest restore'],ids}));
}catch(error){console.log(JSON.stringify({ok:false,message:error.message,ids}));process.exitCode=1}
