create table public.sponsor_questions (
 id uuid primary key default gen_random_uuid(),
 child_id uuid not null references public.children(id),
 sponsor_id uuid not null references auth.users(id),
 question text not null check(char_length(btrim(question)) between 1 and 1500),
 answer text check(answer is null or char_length(btrim(answer)) between 1 and 3000),
 created_at timestamptz not null default now(),
 answered_at timestamptz,
 answered_by uuid references auth.users(id),
 constraint answer_metadata check (
   (answer is null and answered_at is null and answered_by is null) or
   (answer is not null and answered_at is not null and answered_by is not null)
 )
);
create index sponsor_questions_owner on public.sponsor_questions(sponsor_id,created_at desc);
create index sponsor_questions_child on public.sponsor_questions(child_id,created_at desc);
alter table public.sponsor_questions enable row level security;
revoke all on public.sponsor_questions from public,anon,authenticated;
grant select on public.sponsor_questions to authenticated;
grant insert(child_id,sponsor_id,question) on public.sponsor_questions to authenticated;
grant update(answer,answered_at,answered_by) on public.sponsor_questions to authenticated;
grant all on public.sponsor_questions to service_role;
create policy questions_read on public.sponsor_questions for select to authenticated
 using(sponsor_id=(select auth.uid()) or (select private.is_staff()));
create policy questions_ask on public.sponsor_questions for insert to authenticated
 with check(sponsor_id=(select auth.uid()) and answer is null and exists(
   select 1 from public.sponsorships s where s.child_id=sponsor_questions.child_id
   and s.sponsor_id=(select auth.uid()) and s.cancelled_at is null
 ));
create policy questions_answer on public.sponsor_questions for update to authenticated
 using((select private.is_staff()))
 with check((select private.is_staff()) and answered_by=(select auth.uid()) and answer is not null);
