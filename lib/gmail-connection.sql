create table private.campaign_gmail_connection (id boolean primary key check(id), grant_ciphertext text not null, connected_at timestamptz not null default now());
revoke all on private.campaign_gmail_connection from public,anon,authenticated;
create function public.campaign_gmail_status() returns boolean language plpgsql security definer set search_path='' as $$ begin
 if not private.is_staff() then raise exception 'Acceso exclusivo del equipo'; end if;
 return exists(select 1 from private.campaign_gmail_connection);
end $$;
revoke all on function public.campaign_gmail_status() from public,anon;
grant execute on function public.campaign_gmail_status() to authenticated;
create function public.campaign_save_gmail(p_grant text) returns void language plpgsql security definer set search_path='' as $$ begin
 if not private.is_staff() then raise exception 'Acceso exclusivo del equipo'; end if;
 insert into private.campaign_gmail_connection(id,grant_ciphertext) values(true,p_grant)
 on conflict(id) do update set grant_ciphertext=excluded.grant_ciphertext,connected_at=now();
end $$;
revoke all on function public.campaign_save_gmail(text) from public,anon;
grant execute on function public.campaign_save_gmail(text) to authenticated;
