-- ============================================================================
-- eengineer — live delivery for direct messages. `messages` was never added
-- to the supabase_realtime publication (only questions/question_votes/
-- question_comments were, see 20260718120000_community_domain3.sql), so a
-- chat that needs a manual refresh isn't a chat. RLS (msg_select) already
-- restricts delivery to participants who aren't blocked — adding the table to
-- the publication doesn't widen who can read anything, only who gets pushed a
-- change they could already SELECT.
-- ============================================================================

alter publication supabase_realtime add table messages;
