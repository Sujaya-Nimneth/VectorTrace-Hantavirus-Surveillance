-- Lock trigger fn
revoke execute on function public.handle_new_user_role() from public, anon, authenticated;

-- Replace permissive insert/update with role-gated ones
drop policy if exists "Auth can insert cases" on public.hanta_cases;
drop policy if exists "Auth can update cases" on public.hanta_cases;
drop policy if exists "Auth can insert alerts" on public.hanta_alerts;
drop policy if exists "Auth can insert rodent sites" on public.rodent_sites;

create policy "Clinicians can insert cases"
  on public.hanta_cases for insert to authenticated
  with check (public.has_role(auth.uid(), 'epidemiologist') or public.has_role(auth.uid(), 'admin'));

create policy "Clinicians can update cases"
  on public.hanta_cases for update to authenticated
  using (public.has_role(auth.uid(), 'epidemiologist') or public.has_role(auth.uid(), 'admin'));

create policy "Clinicians can insert alerts"
  on public.hanta_alerts for insert to authenticated
  with check (public.has_role(auth.uid(), 'epidemiologist') or public.has_role(auth.uid(), 'admin'));

create policy "Clinicians can insert rodent sites"
  on public.rodent_sites for insert to authenticated
  with check (public.has_role(auth.uid(), 'epidemiologist') or public.has_role(auth.uid(), 'admin'));