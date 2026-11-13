create or replace function public.campaign_sponsor_login_email(p_email text)
returns text language sql stable security definer set search_path='' as $$
 select u.email from auth.users u
 left join public.sponsor_profiles p on p.user_id=u.id
 where u.email_confirmed_at is not null
 and lower(split_part(u.email,'@',2)) <> 'floreciendoconamor.org'
 and coalesce(u.raw_app_meta_data->>'staff_invited','false') <> 'true'
 and (
   (u.raw_app_meta_data->>'campaign_guest'='true' and lower(u.raw_app_meta_data->>'contact_email')=p_email)
   or (u.raw_app_meta_data->>'campaign_account'='true' and lower(u.email)=p_email)
 )
 order by exists(select 1 from public.sponsorships s where s.sponsor_id=u.id and s.cancelled_at is null) desc,
 (lower(u.email)=p_email) desc,u.created_at,u.id
 limit 1
$$;
revoke all on function public.campaign_sponsor_login_email(text) from public,anon,authenticated;
grant execute on function public.campaign_sponsor_login_email(text) to service_role;
