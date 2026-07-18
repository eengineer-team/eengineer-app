-- ============================================================================
-- eengineer — RLS policies (block 16, step 3). Implements docs/AUTHORIZATION.md.
-- All policies target `authenticated` (builders AND preview both carry a JWT;
-- app.status() tells them apart). Anything without a matching policy is DENIED.
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
create policy profiles_select on profiles for select to authenticated
  using (app.is_builder());                                   -- preview cannot browse profiles
create policy profiles_insert on profiles for insert to authenticated
  with check (id = auth.uid() and app.is_builder());
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() and app.is_builder())
  with check (id = auth.uid());
create policy profiles_delete on profiles for delete to authenticated
  using (id = auth.uid() or app.has_role('admin', 'super-admin'));

-- Guard: a user can never flip their own verified flag / provider / id via update.
create or replace function app.profiles_guard() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.verified is distinct from old.verified
     or new.oauth_provider is distinct from old.oauth_provider
     or new.id is distinct from old.id then
    raise exception 'verified / oauth_provider / id are not user-editable';
  end if;
  new.updated_at := now();
  return new;
end; $$;
create trigger profiles_guard_update before update on profiles
  for each row execute function app.profiles_guard();

-- ── user_roles (roles:assign — super-admin only, never self) ─────────────────
create policy user_roles_select on user_roles for select to authenticated
  using (user_id = auth.uid() or app.has_role('admin', 'super-admin'));
create policy user_roles_insert on user_roles for insert to authenticated
  with check (app.has_role('super-admin') and user_id <> auth.uid());
create policy user_roles_update on user_roles for update to authenticated
  using (app.has_role('super-admin') and user_id <> auth.uid())
  with check (app.has_role('super-admin') and user_id <> auth.uid());
create policy user_roles_delete on user_roles for delete to authenticated
  using (app.has_role('super-admin') and user_id <> auth.uid());

-- Defense-in-depth: block self role writes even if a policy is ever loosened.
create or replace function app.user_roles_guard() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.user_id, old.user_id) = auth.uid() then
    raise exception 'cannot modify your own role';
  end if;
  return coalesce(new, old);
end; $$;
create trigger user_roles_guard_write before insert or update or delete on user_roles
  for each row execute function app.user_roles_guard();

-- ── profile sub-resources: owner-only writes, builder-read ───────────────────
create policy skills_select on skills for select to authenticated using (app.is_builder());
create policy skills_write  on skills for all    to authenticated
  using (app.is_builder() and profile_id = auth.uid())
  with check (app.is_builder() and profile_id = auth.uid());

create policy exp_select on experiences for select to authenticated using (app.is_builder());
create policy exp_write  on experiences for all    to authenticated
  using (app.is_builder() and profile_id = auth.uid())
  with check (app.is_builder() and profile_id = auth.uid());

create policy ppe_select on profile_project_entries for select to authenticated using (app.is_builder());
create policy ppe_write  on profile_project_entries for all    to authenticated
  using (app.is_builder() and profile_id = auth.uid())
  with check (app.is_builder() and profile_id = auth.uid());

-- ── endorsements: verified insert, no self, immutable, endorser-deletes ───────
create policy endorse_select on endorsements for select to authenticated using (app.is_builder());
create policy endorse_insert on endorsements for insert to authenticated
  with check (app.is_verified() and from_id = auth.uid() and from_id <> profile_id);
create policy endorse_delete on endorsements for delete to authenticated
  using (from_id = auth.uid());
-- (no update policy ⇒ endorsements are immutable)

-- ── projects hub: owner-only writes ──────────────────────────────────────────
create policy projects_select on projects for select to authenticated using (app.is_builder());
create policy projects_write  on projects for all    to authenticated
  using (app.is_builder() and owner_id = auth.uid())
  with check (app.is_builder() and owner_id = auth.uid());

create policy pstats_select on project_stats for select to authenticated using (app.is_builder());
create policy pstats_write  on project_stats for all    to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy pfollow_select on project_followers for select to authenticated using (app.is_builder());
create policy pfollow_write  on project_followers for all    to authenticated
  using (app.is_builder() and follower_id = auth.uid())
  with check (app.is_builder() and follower_id = auth.uid());

create policy pfeedback_select on project_feedback for select to authenticated using (app.is_builder());
create policy pfeedback_insert on project_feedback for insert to authenticated
  with check (app.is_verified() and from_id = auth.uid());
create policy pfeedback_modify on project_feedback for update to authenticated
  using (from_id = auth.uid()) with check (from_id = auth.uid());
create policy pfeedback_delete on project_feedback for delete to authenticated
  using (from_id = auth.uid());

-- ── connections: requester requests, only addressee accepts ──────────────────
create policy conn_select on connections for select to authenticated
  using (app.is_builder() and auth.uid() in (requester_id, addressee_id));
create policy conn_insert on connections for insert to authenticated
  with check (app.is_verified()
              and requester_id = auth.uid()
              and requester_id <> addressee_id
              and status = 'requested'
              and app.profile_verified(addressee_id));
create policy conn_update on connections for update to authenticated
  using (addressee_id = auth.uid())                    -- requester can NEVER self-accept
  with check (addressee_id = auth.uid() and status in ('connected', 'declined'));
create policy conn_delete on connections for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- ── clubs ────────────────────────────────────────────────────────────────────
create policy clubs_select on club_memberships for select to authenticated using (app.is_builder());
create policy clubs_write  on club_memberships for all    to authenticated
  using (app.is_builder() and profile_id = auth.uid())
  with check (app.is_builder() and profile_id = auth.uid());

-- ── community Q&A (preview may READ questions only) ──────────────────────────
create policy q_select on questions for select to authenticated
  using (app.is_builder() or app.is_preview());
create policy q_insert on questions for insert to authenticated
  with check (app.is_verified() and author_id = auth.uid());
create policy q_modify on questions for update to authenticated
  using (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'))
  with check (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'));
create policy q_delete on questions for delete to authenticated
  using (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'));

create policy qvote_select on question_votes for select to authenticated using (app.is_builder());
create policy qvote_write  on question_votes for all    to authenticated
  using (app.is_builder() and user_id = auth.uid())
  with check (app.is_builder() and user_id = auth.uid());   -- 1 row/user via PK; change only own

create policy qc_select on question_comments for select to authenticated using (app.is_builder());
create policy qc_insert on question_comments for insert to authenticated
  with check (app.is_verified() and author_id = auth.uid());
create policy qc_modify on question_comments for update to authenticated
  using (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'))
  with check (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'));
create policy qc_delete on question_comments for delete to authenticated
  using (author_id = auth.uid() or app.has_role('community-lead','admin','super-admin'));

-- ── reports & blocks ─────────────────────────────────────────────────────────
create policy reports_select on reports for select to authenticated
  using (app.has_role('community-lead','admin','super-admin'));   -- queue is staff-only
create policy reports_insert on reports for insert to authenticated
  with check (app.is_builder() and reporter_id = auth.uid());

create policy blocks_select on blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_insert on blocks for insert to authenticated
  with check (app.is_builder() and blocker_id = auth.uid() and blocker_id <> blocked_id);
create policy blocks_delete on blocks for delete to authenticated using (blocker_id = auth.uid());

-- ── messaging — SAFETY-CRITICAL gate (verified + connected + not blocked) ────
create policy conv_select on conversations for select to authenticated
  using (app.is_builder() and auth.uid() in (participant_a, participant_b));
create policy conv_insert on conversations for insert to authenticated
  with check (app.is_verified()
              and auth.uid() in (participant_a, participant_b)
              and app.can_message(participant_a, participant_b));
create policy conv_delete on conversations for delete to authenticated
  using (auth.uid() in (participant_a, participant_b));

create policy msg_select on messages for select to authenticated
  using (app.is_builder()
         and app.is_participant(conversation_id, auth.uid())
         and not app.is_blocked(auth.uid(), app.other_participant(conversation_id, auth.uid())));
create policy msg_insert on messages for insert to authenticated
  with check (sender_id = auth.uid()
              and app.is_participant(conversation_id, auth.uid())
              and app.can_message(auth.uid(), app.other_participant(conversation_id, auth.uid())));
create policy msg_delete on messages for delete to authenticated
  using (sender_id = auth.uid());

-- ── events / reference data ──────────────────────────────────────────────────
create policy web_select on webinars for select to authenticated using (app.is_builder());
create policy web_write  on webinars for all    to authenticated
  using (app.has_role('community-lead','admin','super-admin'))
  with check (app.has_role('community-lead','admin','super-admin'));

create policy rsvp_select on webinar_rsvps for select to authenticated using (app.is_builder());
create policy rsvp_write  on webinar_rsvps for all    to authenticated
  using (app.is_builder() and user_id = auth.uid())
  with check (app.is_builder() and user_id = auth.uid());

create policy comp_select on competitions for select to authenticated using (app.is_builder());
create policy comp_write  on competitions for all    to authenticated
  using (app.has_role('admin','super-admin'))
  with check (app.has_role('admin','super-admin'));

create policy opp_select on opportunities for select to authenticated
  using (app.is_builder() or app.is_preview());     -- preview may view opportunities
create policy opp_write  on opportunities for all    to authenticated
  using (app.has_role('admin','super-admin'))
  with check (app.has_role('admin','super-admin'));
