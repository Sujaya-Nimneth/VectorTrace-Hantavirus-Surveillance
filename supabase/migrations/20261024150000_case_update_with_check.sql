-- UPDATE policies should re-validate on the resulting row. Without WITH
-- CHECK, a statement whose USING predicate passes could still write rows
-- the predicate wouldn't cover.

drop policy if exists "Clinicians can update cases" on public.hanta_cases;

create policy "Clinicians can update cases"
  on public.hanta_cases for update to authenticated
  using (
    public.has_role(auth.uid(), 'epidemiologist')
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'epidemiologist')
    or public.has_role(auth.uid(), 'admin')
  );
