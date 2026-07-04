import { motion } from 'framer-motion'
import { GitBranch, CheckCircle2, Plus, CalendarDays, Users } from 'lucide-react'

// Mock profiles — represent real product data shape
const FEATURED = {
  initials: 'AK',
  name: 'Alex Kim',
  discipline: 'Aerospace Engineering',
  skills: ['CFD Analysis', 'MATLAB', 'SolidWorks'],
  projects: [
    { name: 'Rocket Propulsion Simulator', year: '2025' },
    { name: 'Airfoil Optimization Tool', year: '2024' },
  ],
  connections: 34,
}

const MEMBERS = [
  { initials: 'MR', name: 'Marcus R.', color: '#5C4A1E', discipline: 'Software' },
  { initials: 'PT', name: 'Priya T.', color: '#7B5E2A', discipline: 'Electrical' },
  { initials: 'JO', name: 'James O.', color: '#8B6914', discipline: 'Mechanical' },
  { initials: 'SK', name: 'Sophie K.', color: '#4A3510', discipline: 'Software' },
  { initials: 'DP', name: 'Dev P.', color: '#A0845C', discipline: 'Civil' },
]

const AVATAR_BG = '#8B6914'

const cardFade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function CommunityPreview() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
      className="flex flex-col gap-3 w-full max-w-[320px]"
      aria-label="Sample builder profiles"
    >
      {/* Label */}
      <motion.div variants={cardFade} transition={{ duration: 0.4 }}>
        <span className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-corn-700">
          Builder Network
        </span>
      </motion.div>

      {/* Main profile card */}
      <motion.div
        variants={cardFade}
        transition={{ duration: 0.45 }}
        className="bg-white/65 border border-corn-900/10 rounded-lg overflow-hidden"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Card header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: AVATAR_BG }}
            >
              <span className="font-display text-[0.75rem] font-bold text-corn-100 leading-none">
                {FEATURED.initials}
              </span>
            </div>
            <div>
              <div className="font-sans text-[0.875rem] font-semibold text-[#2A2118] leading-tight">
                {FEATURED.name}
              </div>
              <div className="font-sans text-[0.75rem] text-corn-700 mt-0.5">
                {FEATURED.discipline}
              </div>
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex items-center gap-1 bg-corn-900 text-corn-200 rounded px-2 py-1 flex-shrink-0">
            <GitBranch size={10} strokeWidth={2} />
            <span className="font-sans text-[10px] font-medium tracking-wide">GitHub</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-corn-900/8 mx-5" />

        {/* Skills */}
        <div className="px-5 py-3">
          <div className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-corn-700 mb-2">
            Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FEATURED.skills.map((s) => (
              <span
                key={s}
                className="font-sans text-[11px] text-[#2A2118] bg-corn-200/70 px-2 py-0.5 rounded-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="px-5 pb-4">
          <div className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-corn-700 mb-2">
            Projects
          </div>
          <div className="space-y-0">
            {FEATURED.projects.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between py-2 ${i < FEATURED.projects.length - 1 ? 'border-b border-corn-900/8' : ''}`}
              >
                <span className="font-sans text-[0.8125rem] text-[#2A2118] leading-tight">
                  {p.name}
                </span>
                <span className="font-sans text-[11px] text-corn-700 flex-shrink-0 ml-3">
                  {p.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-corn-900/8 mx-5" />

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="font-sans text-[11px] text-corn-700">
            {FEATURED.connections} mutual connections
          </span>
          <button className="flex items-center gap-1 font-sans text-[11px] font-medium text-corn-900 hover:text-corn-700 transition-colors">
            <Plus size={11} strokeWidth={2.5} />
            Connect
          </button>
        </div>
      </motion.div>

      {/* Member row */}
      <motion.div
        variants={cardFade}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        {/* Overlapping avatars */}
        <div className="flex items-center">
          {MEMBERS.map((m, i) => (
            <div
              key={m.initials}
              title={`${m.name} · ${m.discipline}`}
              className="w-7 h-7 rounded-full border-2 border-corn-100 flex items-center justify-center flex-shrink-0"
              style={{
                background: m.color,
                marginLeft: i > 0 ? '-8px' : '0',
                zIndex: MEMBERS.length - i,
                position: 'relative',
              }}
            >
              <span className="font-sans text-[9px] font-bold text-corn-100 leading-none">
                {m.initials}
              </span>
            </div>
          ))}
        </div>

        <div>
          <div className="font-sans text-[0.75rem] font-medium text-[#2A2118]">
            2,400+ verified builders
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <CheckCircle2 size={10} strokeWidth={2} className="text-corn-700" />
            <span className="font-sans text-[10px] text-corn-700">
              GitHub · LinkedIn only
            </span>
          </div>
        </div>
      </motion.div>

      {/* Discipline tags strip */}
      <motion.div
        variants={cardFade}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap gap-1.5"
      >
        {['Aerospace', 'Mechanical', 'Software', 'Electrical', 'Civil'].map((d) => (
          <span
            key={d}
            className="font-sans text-[10px] tracking-wide text-corn-800 bg-corn-900/6 border border-corn-900/10 rounded-sm px-2 py-0.5"
          >
            {d}
          </span>
        ))}
      </motion.div>

      {/* Provider icons note */}
      <motion.div
        variants={cardFade}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        <GitBranch size={11} strokeWidth={1.8} className="text-corn-700 flex-shrink-0" />
        <span className="font-sans text-[10px] text-corn-700 leading-tight">
          OAuth-verified only. No profile data stored beyond identity confirmation.
        </span>
      </motion.div>

      {/* Upcoming webinar — fills bottom-right, maps to Monthly Webinars feature */}
      <motion.div
        variants={cardFade}
        transition={{ duration: 0.4 }}
        className="mt-1 bg-white/40 border border-corn-900/10 rounded-lg p-4"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700">
            Next webinar
          </span>
          <CalendarDays size={12} strokeWidth={1.8} className="text-corn-700" />
        </div>

        {/* Title */}
        <div className="font-sans text-[0.875rem] font-semibold text-[#2A2118] leading-snug mb-1">
          Aerospace Propulsion Systems
        </div>

        {/* Discipline tag */}
        <div className="font-sans text-[11px] text-corn-700 mb-3">
          Aerospace · Fri, Jul 18 · 5:00 PM EST
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2118]/8 mb-3" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={11} strokeWidth={1.8} className="text-corn-700" />
            <span className="font-sans text-[11px] text-[#2A2118]">
              23 attending
            </span>
          </div>
          <button className="font-sans text-[11px] font-semibold text-[#2A2118] hover:text-corn-700 transition-colors tracking-wide">
            Register →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
