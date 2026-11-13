create function private.set_gift_delivery(p_id uuid,p_method text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_method is null or p_method not in ('Punto de entrega de la fundación en Bogotá','Acordaré otro punto con la fundación') then raise exception 'Selecciona un punto de entrega válido'; end if;
 update public.sponsorships set delivery_method=p_method where id=p_id and sponsor_id=auth.uid() and cancelled_at is null and donor_delivered_at is null and staff_received_at is null;
 if not found then raise exception 'Este compromiso ya no se puede editar'; end if;
end $$;
revoke all on function private.set_gift_delivery(uuid,text) from public,anon;
grant execute on function private.set_gift_delivery(uuid,text) to authenticated;
create function public.set_gift_delivery(p_id uuid,p_method text) returns void language sql set search_path='' as $$ select private.set_gift_delivery(p_id,p_method) $$;
revoke all on function public.set_gift_delivery(uuid,text) from public,anon;
grant execute on function public.set_gift_delivery(uuid,text) to authenticated;
