revoke select on public.campaigns from public,anon,authenticated;
revoke select(delivery_address) on public.campaigns from public,anon,authenticated;
grant select(id,slug,title,deadline,timezone,novena_at,novena_location,contact_phone,bank_details,active,created_at,accepting_sponsorships) on public.campaigns to anon,authenticated;

create function private.sponsor_delivery_address(p_campaign_id uuid) returns text
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(
   select 1 from public.sponsorships s join public.children ch on ch.id=s.child_id
   where ch.campaign_id=p_campaign_id and s.sponsor_id=auth.uid() and s.cancelled_at is null
 ) then raise insufficient_privilege using message='La dirección está disponible para padrinos con un compromiso activo.';
 end if;
 return (select ca.delivery_address from public.campaigns ca where ca.id=p_campaign_id);
end;
$$;
revoke all on function private.sponsor_delivery_address(uuid) from public,anon;
grant execute on function private.sponsor_delivery_address(uuid) to authenticated;
create function public.sponsor_delivery_address(p_campaign_id uuid) returns text
language sql stable security invoker set search_path='' as $$
 select private.sponsor_delivery_address(p_campaign_id);
$$;
revoke all on function public.sponsor_delivery_address(uuid) from public,anon;
grant execute on function public.sponsor_delivery_address(uuid) to authenticated;
