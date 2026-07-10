import { LegalDocument, Section } from '@/pages/legal/LegalDocument'

export function Privacy() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="July 10, 2026">
      <p>
        Short version: we collect what we need to run the platform, we don't sell your
        data, and we use GitHub/LinkedIn/Google sign-in only to verify you're a real
        person and populate your profile if you choose to.
      </p>

      <Section heading="1. What we collect">
        <p>
          <strong>Account info:</strong> the name, email, and profile details (e.g.
          avatar, headline, linked repos) provided by GitHub, LinkedIn, or Google when
          you sign in.
        </p>
        <p>
          <strong>Content you create:</strong> your profile, projects you post, club
          memberships, Q&A posts, and direct messages you send.
        </p>
        <p>
          <strong>Usage data:</strong> basic activity needed to make the product work —
          e.g. which clubs you've joined, what you've saved — plus standard technical
          logs (IP, browser, timestamps) for security and debugging.
        </p>
      </Section>

      <Section heading="2. What we don't do">
        <p>
          We don't sell your data to third parties. We don't use your GitHub or LinkedIn
          access to post on your behalf, read your private repos, or scrape your
          connections. Google sign-in is read-only browsing on our end too — it doesn't
          create or save anything under your account.
        </p>
      </Section>

      <Section heading="3. How we use it">
        <p>
          To run the core features: matching you with clubs and opportunities, showing
          your profile to other users, delivering messages, and displaying projects
          you've posted. We may use aggregated, non-identifying usage data to understand
          how the platform is used and improve it.
        </p>
      </Section>

      <Section heading="4. Messaging">
        <p>
          Direct messages are stored so the conversation persists between sessions, but
          they are not monitored or read by us as a matter of course. See the Terms of
          Service for how unmoderated messaging works. We may access message content if
          required to investigate a specific abuse report or legal request.
        </p>
      </Section>

      <Section heading="5. Who can see what">
        <p>
          Your profile, posted projects, and Q&A activity are visible to other signed-in
          users by default — that's the point of the platform. Direct messages are only
          visible to the sender and recipient. We don't publish your account to the
          public internet beyond what you post as user-facing content.
        </p>
      </Section>

      <Section heading="6. Third-party services">
        <p>
          We use GitHub, LinkedIn, and Google solely as identity providers (OAuth) —
          they confirm who you are, and in some cases supply profile fields you can
          choose to display. Clubs, grants, and opportunities linked from the platform
          are run by outside organizations with their own privacy practices; we're not
          responsible for those.
        </p>
      </Section>

      <Section heading="7. Data retention & deletion">
        <p>
          We keep your data for as long as your account is active. If you want your
          account and associated data deleted, contact us at the address below and we'll
          process the request — note that messages you've sent to other users may remain
          visible to the recipient, similar to email.
        </p>
      </Section>

      <Section heading="8. Changes to this policy">
        <p>
          This is a draft policy for an early-stage platform and will be revised before
          public release. We'll update the date at the top of this page when we do, and
          flag material changes to signed-in users.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Questions about this policy, or a data request: <a href="mailto:eengineer.team@gmail.com" className="underline underline-offset-2 hover:text-[#2A2118] transition-colors">eengineer.team@gmail.com</a>.
        </p>
      </Section>
    </LegalDocument>
  )
}
