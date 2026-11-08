import crypto from 'node:crypto';
const BASE='https://hmogxgyjpyxxosmaonot.supabase.co',KEY='sb_publishable_bqRmNvombSdtrST6HM8cRA_vTPPwNZ5';
const password='PruebaTemporal!2026Cuenta';
const email='qa-account-'+crypto.randomBytes(5).toString('hex')+'@example.invalid';
async function request(path,body,bearer){const r=await fetch(BASE+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(bearer?{Authorization:'Bearer '+bearer}:{})},body:JSON.stringify(body)});const data=await r.json();return {status:r.status,data}}
const access=(body,bearer)=>request('/functions/v1/campaign-access',body,bearer);
const created=await access({action:'register',email,password});if(created.status!==200)throw Error(JSON.stringify(created));
const u=created.data.session.user;if(u.email!==email||u.app_metadata.campaign_account!==true)throw Error('Account not persisted');
const login=await request('/auth/v1/token?grant_type=password',{email,password});if(login.data.user?.id!==u.id)throw Error('Password login failed');
const role=await request('/rest/v1/rpc/current_user_is_staff',{},login.data.access_token);if(role.data!==false)throw Error('External account acquired internal access');
const duplicate=await access({action:'register',email,password:'OtraClaveNoAutorizada!2026'});if(duplicate.status!==409)throw Error('Duplicate account protection failed');
const wrong=await request('/auth/v1/token?grant_type=password',{email,password:'OtraClaveNoAutorizada!2026'});if(wrong.status===200)throw Error('Duplicate registration changed password');
const internal=await access({action:'register',email:'no-autorizado@floreciendoconamor.org',password});if(internal.status!==403)throw Error('Uninvited internal registration allowed');
const guest=await access({action:'guest',email:'qa-migration@example.invalid'});if(guest.status!==200)throw Error('Guest fixture failed');
const migrationEmail='qa-migrate-'+crypto.randomBytes(5).toString('hex')+'@example.invalid';
const migrated=await access({action:'register',email:migrationEmail,password},guest.data.session.access_token);
if(migrated.data.session?.user.id!==guest.data.session.user.id||migrated.data.session.user.app_metadata.campaign_guest!==false)throw Error('Existing sponsor account migration failed');
console.log(JSON.stringify({ok:true,email,userId:u.id,migratedUserId:guest.data.session.user.id,checks:['persistent account','email/password login','external permissions','no duplicate takeover','internal invitation required','guest migration preserves identity']}));
