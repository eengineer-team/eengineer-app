import * as React from 'react'
import { Plus, Minus } from 'lucide-react'

interface TeamMember {
  name: string
  photo: string
  github: string | null
  linkedin: string | null
  bio: string
  chips: string[]
}

const TEAM: TeamMember[] = [
  {
    name: 'Jalen',
    photo: '/team/jalen.jpg',
    github: '#',
    linkedin: null,
    bio: 'They call me Jalen, and I come from 2009. I excel in swimming, ping pong and cs games. Attempted academic tests so far is IELTS and SAT with an according 7 and 1530 (1540 with a superscore). I am average above speed typer with a 100 wpm. My major is machine learning and the owner of couple of related projects in this field.',
    chips: ['Machine Learning', 'ML projects'],
  },
  {
    name: 'Jakhongir',
    photo: '/team/jakhongir.jpg',
    github: '#',
    linkedin: '#',
    bio: "Jakhongir, 16, from Navoi. Been building since 14 — now an automation & AI agent product for real estate. Business Analytics/BizOps by major, but I think in casting before I think in story. Give me a good problem and a team that laughs together, and I'll stay up too late solving it.",
    chips: ['Business Analytics / BizOps', 'Automation & AI agents', 'Navoi'],
  },
  {
    name: 'Rasulbek',
    photo: '/team/rasulbek.jpg',
    github: null,
    linkedin: null,
    bio: "Alright, let's do this one last time. I'm Rasulbek, a rising senior at Khiva Presidential School. I want to pursue mechanical / environmental engineering — passionate about solving local environmental problems, with the Aral Sea at the top of my list. Outside of that, I'm into videography, photography, and video editing: I make STEM content as a solo creator at Pozitron, and co-lead O'zbegim Merosi to promote cultural heritage.",
    chips: ['Mechanical / Environmental Engineering', 'Videography & Content', 'Khiva'],
  },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .32.192.694.801.576C20.566 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.114 20.452H3.558V9h3.556v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

function MemberPhoto({ name, photo }: { name: string; photo: string }) {
  const [failed, setFailed] = React.useState(false)

  if (failed) {
    return (
      <div
        className="w-full aspect-square sm:w-[180px] sm:h-[180px] sm:aspect-auto rounded-full bg-[#2A2118] flex items-center justify-center flex-shrink-0"
        role="img"
        aria-label={name}
      >
        <span className="font-display text-[1.75rem] font-extrabold text-corn-100 leading-none">
          {initials(name)}
        </span>
      </div>
    )
  }

  return (
    <img
      src={photo}
      alt={name}
      onError={() => setFailed(true)}
      className="w-full aspect-square sm:w-[180px] sm:h-[180px] sm:aspect-auto rounded-xl object-cover flex-shrink-0 [filter:sepia(0.10)_saturate(0.92)_contrast(1.02)]"
    />
  )
}

// Squeezed per founder feedback: the full bios used to always render at the
// bottom of the hero; now it's collapsed behind a "+ Team members" pill and
// only expands on request. Kept as a real toggle (not a link to a separate
// page) so it stays anchored at the very bottom of the landing page either way.
export function TeamAbout() {
  const [open, setOpen] = React.useState(false)

  return (
    <section className="px-5 sm:px-10 py-10 border-t border-[#2A2118]/8">
      {/* One line of the team's voice stays visible without a click (notebook
          pass, 07.2026) — the bios behind the toggle are the most alive text
          on the site, and a fully collapsed section hid that entirely. */}
      <p className="font-sans text-[0.9375rem] leading-[1.6] text-[#2A2118] max-w-[560px] mb-5">
        Built by three students from Uzbekistan — Navoi, Khiva, and one guy who
        introduces himself as "coming from 2009."
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-corn-900/20 pl-3 pr-4 py-1.5 font-sans text-[0.8125rem] font-medium text-corn-900 hover:bg-corn-900/6 transition-colors duration-150"
      >
        <span className="w-5 h-5 rounded-full bg-corn-900 text-corn-100 flex items-center justify-center flex-shrink-0">
          {open ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
        </span>
        Team members
      </button>

      {!open ? null : (
      <div className="mt-10">
      {/* Section label + heading */}
      <div className="mb-12 max-w-[640px]">
        <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-corn-700 block mb-3">
          Team
        </span>
        <h2 className="font-display font-extrabold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em] mb-3">
          The people behind it.
        </h2>
        <p className="font-sans text-[0.9375rem] text-corn-800">
          No titles, no org chart — read the background.
        </p>
      </div>

      {/* Member cards — one per row */}
      <div className="flex flex-col gap-10">
        {TEAM.map((member) => (
          <div
            key={member.name}
            className="flex flex-col sm:flex-row gap-6 sm:gap-8"
          >
            <MemberPhoto name={member.name} photo={member.photo} />

            <div className="flex-1 min-w-0">
              {/* Name + social links */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-display font-extrabold text-[#2A2118] text-[1.75rem] leading-tight tracking-[-0.01em]">
                  {member.name}
                </h3>

                {(member.github || member.linkedin) && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on GitHub`}
                        className="w-[30px] h-[30px] flex items-center justify-center rounded border border-corn-900/15 text-corn-700 hover:border-corn-900/40 hover:text-[#2A2118] transition-colors duration-150"
                      >
                        <GithubIcon />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on LinkedIn`}
                        className="w-[30px] h-[30px] flex items-center justify-center rounded border border-corn-900/15 text-corn-700 hover:border-corn-900/40 hover:text-[#2A2118] transition-colors duration-150"
                      >
                        <LinkedinIcon />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="font-sans text-[0.9375rem] leading-[1.6] text-[#2A2118] max-w-[560px] mb-4">
                {member.bio}
              </p>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {member.chips.map((chip) => (
                  <span
                    key={chip}
                    className="font-sans text-[11px] tracking-wide text-corn-800 bg-corn-900/6 border border-corn-900/10 rounded-sm px-2 py-0.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
      )}
    </section>
  )
}
