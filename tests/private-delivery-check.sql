-- Isolated fixtures and all writes are rolled back, including Auth users.
begin;
select set_config('qa.owner',gen_random_uuid()::text,true),
 set_config('qa.other',gen_random_uuid()::text,true),
 set_config('qa.staff',gen_random_uuid()::text,true),
 set_config('qa.campaign',gen_random_uuid()::text,true),
 set_config('qa.child',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values
 (current_setting('qa.owner')::uuid,'question-owner@example.invalid',now(),'{}'),
 (current_setting('qa.other')::uuid,'question-other@example.invalid',now(),'{}'),
 (current_setting('qa.staff')::uuid,'question-qa@floreciendoconamor.org',now(),'{}');
insert into public.campaigns(id,slug,title,deadline,active,delivery_address) values
 (current_setting('qa.campaign')::uuid,'qa-questions-'||current_setting('qa.campaign'),'QA questions',now()+interval '1 day',false,'PUNTO PRIVADO QA');
insert into public.children(id,campaign_id,code,display_name) values
 (current_setting('qa.child')::uuid,current_setting('qa.campaign')::uuid,'QA','QA question fixture');
insert into public.sponsor_profiles(user_id,full_name,phone,city,contact_consent_at) values
 (current_setting('qa.owner')::uuid,'QA owner','0','QA',now());
insert into public.sponsorships(child_id,sponsor_id,gift_part,delivery_method) values
 (current_setting('qa.child')::uuid,current_setting('qa.owner')::uuid,'clothes','QA');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true);
do $$begin
 if public.sponsor_delivery_address(current_setting('qa.campaign')::uuid)<>'PUNTO PRIVADO QA' then raise exception 'Active sponsor did not receive address'; end if;
 begin
  perform delivery_address from public.campaigns;
  raise exception 'Direct address access allowed';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.sponsor_questions(child_id,sponsor_id,question) values
 (current_setting('qa.child')::uuid,current_setting('qa.owner')::uuid,'¿La talla aplica a ambas prendas?');
do $$declare n int; begin
 select count(*) into n from public.sponsor_questions where child_id=current_setting('qa.child')::uuid;
 if n<>1 then raise exception 'Owner cannot read own question'; end if;
 update public.sponsor_questions set answer='Forged',answered_at=now(),answered_by=auth.uid() where child_id=current_setting('qa.child')::uuid;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Sponsor answered as staff'; end if;
 begin
  update public.sponsor_questions set question='Changed' where child_id=current_setting('qa.child')::uuid;
  raise exception 'Question tampering allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.sponsor_questions(child_id,sponsor_id,question) values(current_setting('qa.child')::uuid,current_setting('qa.other')::uuid,'Spoofed');
  raise exception 'Spoofed sponsor accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.sponsor_questions(child_id,sponsor_id,question) values(current_setting('qa.child')::uuid,auth.uid(),'   ');
  raise exception 'Whitespace accepted';
 exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.other'),true);
do $$begin begin perform public.sponsor_delivery_address(current_setting('qa.campaign')::uuid); raise exception 'Non-sponsor received address'; exception when insufficient_privilege then null; end; end $$;
do $$begin
 if exists(select 1 from public.sponsor_questions where child_id=current_setting('qa.child')::uuid) then raise exception 'Another sponsor can read private question'; end if;
 begin
  insert into public.sponsor_questions(child_id,sponsor_id,question) values(current_setting('qa.child')::uuid,auth.uid(),'Unrelated child');
  raise exception 'Unrelated sponsor can ask';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.staff'),true);
do $$declare n int; begin
 update public.sponsor_questions set answer='Sí, talla 12 para ambas prendas.',answered_at=now(),answered_by=auth.uid() where child_id=current_setting('qa.child')::uuid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Staff cannot reply'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true);
do $$begin
 if not exists(select 1 from public.sponsor_questions where child_id=current_setting('qa.child')::uuid and answer='Sí, talla 12 para ambas prendas.') then raise exception 'Owner cannot read answer'; end if;
end $$;
reset role;
update public.sponsorships set cancelled_at=now() where child_id=current_setting('qa.child')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true);
do $$begin begin perform public.sponsor_delivery_address(current_setting('qa.campaign')::uuid); raise exception 'Cancelled sponsor received address'; exception when insufficient_privilege then null; end; end $$;
reset role;
set local role anon;
do $$begin
 begin perform delivery_address from public.campaigns; raise exception 'Anonymous address access allowed'; exception when insufficient_privilege then null; end;
 begin perform public.sponsor_delivery_address(current_setting('qa.campaign')::uuid); raise exception 'Anonymous address RPC allowed'; exception when insufficient_privilege then null; end;
end $$;

do $$begin
 begin
  perform 1 from public.sponsor_questions;
  raise exception 'Anonymous access allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: address restricted to active sponsors; direct, anonymous, non-sponsor and cancelled access blocked; question flow still passes; all fixtures rolled back' as result;
