// Fire-and-forget from the client after a competition_registrations insert
// succeeds (see api/competitions.ts registerForCompetition) -- this never
// blocks or reverses the registration itself. Two things have to be true
// for an email to actually go out, and both are optional/admin-set, not
// hard requirements:
//   1. The competition has an organizer_email (nullable column, filled in
//      per-competition via SQL -- there's no admin UI for it yet).
//   2. The RESEND_API_KEY secret is configured on this project.
// Missing either one is a normal, expected state for most competitions
// right now, not an error -- this returns 200 "skipped" rather than
// failing, so the client's fire-and-forget .catch() never even sees it.
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    const { competitionId, name, email, teamSchool } = await req.json()
    if (!competitionId || !name || !email || !teamSchool) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: competition, error } = await supabase
      .from('competitions')
      .select('name, organizer, organizer_email')
      .eq('id', competitionId)
      .maybeSingle()

    if (error) throw error
    if (!competition?.organizer_email) {
      return new Response(JSON.stringify({ skipped: 'no organizer_email set for this competition' }), { status: 200 })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ skipped: 'RESEND_API_KEY not configured' }), { status: 200 })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_ADDRESS') ?? 'eengineer.net <onboarding@resend.dev>',
        to: competition.organizer_email,
        subject: `New registration for ${competition.name} — eengineer.net`,
        text:
          `${name} registered for ${competition.name} via eengineer.net.\n\n` +
          `Name: ${name}\nEmail: ${email}\nTeam/School: ${teamSchool}\n`,
      }),
    })

    if (!emailResponse.ok) {
      const body = await emailResponse.text()
      throw new Error(`Resend API error (${emailResponse.status}): ${body}`)
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (err) {
    console.error('notify-competition-registration failed', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
