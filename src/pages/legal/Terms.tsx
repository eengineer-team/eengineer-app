import { LegalDocument, Section } from '@/pages/legal/LegalDocument'

export function Terms() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="July 10, 2026">
      <p>
        eengineer is a platform for student builders — engineers, designers, and makers —
        to find clubs, projects, opportunities, and each other. These terms cover the
        basics of using it. We've kept them short on purpose.
      </p>

      <Section heading="1. Who can use this">
        <p>
          eengineer is aimed at students and early-career builders. You need to be able
          to form a binding agreement in your jurisdiction to use the platform. If you're
          using it through a school or club account, you're still individually responsible
          for your own activity.
        </p>
      </Section>

      <Section heading="2. Signing in">
        <p>
          We use GitHub, LinkedIn, or Google to verify you're a real person, not a bot.
          Signing in with Google gives you read-only browsing — nothing is saved or
          created under that identity. Signing in with GitHub or LinkedIn gives you full
          access: joining clubs, posting projects, messaging other users.
        </p>
        <p>
          We don't use your GitHub or LinkedIn data for anything beyond identity
          verification and, where you choose to show it, populating your profile (e.g.
          repos, headline). We don't post on your behalf.
        </p>
      </Section>

      <Section heading="3. Your content">
        <p>
          Anything you post — project listings, profile info, messages, Q&A posts — is
          yours. By posting it, you're giving other users on the platform permission to
          see it and interact with it as the feature intends (e.g. a project you post is
          visible to people browsing Opportunities). We're not claiming ownership of it.
        </p>
        <p>
          Don't post anything you don't have the right to post, anything illegal, or
          anything meant to harass, deceive, or spam other users.
        </p>
      </Section>

      <Section heading="4. Messaging is unmoderated">
        <p>
          Direct messages between users are not monitored or moderated by us. Treat DMs
          the way you'd treat messages on any other platform — use judgment about what
          you share, and don't rely on us to intervene in a conversation. If someone is
          harassing you or abusing the platform, contact us (below) and we'll look at
          account-level action, but we do not read messages proactively.
        </p>
      </Section>

      <Section heading="5. Clubs, projects, and third parties">
        <p>
          Clubs, competitions, grants, and opportunities listed on eengineer are run by
          third parties — schools, organizations, sponsors — not by us. We link to them
          and, where noted, aggregate info about them, but we aren't a party to your
          participation in them and can't guarantee their availability, accuracy, or
          outcome.
        </p>
      </Section>

      <Section heading="6. Account termination">
        <p>
          You can stop using eengineer any time. We can suspend or remove accounts that
          violate these terms — spam, harassment, impersonation, abuse of other users —
          without advance notice.
        </p>
      </Section>

      <Section heading="7. No warranty">
        <p>
          eengineer is provided as-is. We're a small, early-stage platform — features may
          change, break, or move as we build. We'll try to give notice for anything that
          affects your data or access, but we can't promise the platform will always be
          available or bug-free.
        </p>
      </Section>

      <Section heading="8. Changes to these terms">
        <p>
          These are draft terms for an early platform and will be revised as we approach
          public release. We'll update the date at the top of this page when we do, and
          flag material changes to signed-in users.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Questions about these terms, or anything else: <a href="mailto:eengineer.team@gmail.com" className="underline underline-offset-2 hover:text-[#2A2118] transition-colors">eengineer.team@gmail.com</a>.
        </p>
      </Section>
    </LegalDocument>
  )
}
