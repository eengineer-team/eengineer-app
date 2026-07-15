import * as React from 'react'
import { useAuth } from '@/lib/auth-context'
import { DISCIPLINES, type Discipline } from '@/lib/community-data'
import { SEED_OPPORTUNITIES, rankByDiscipline, isMatch } from '@/lib/opportunities-data'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'

const DISCIPLINE_KEY = 'ee_opportunities_discipline'

export function Opportunities() {
  const { user } = useAuth()
  const isBuilder = user?.status === 'builder'

  // Personalization is Builder-only — Google-preview always sees the full,
  // unranked feed (spec: page fully available to both, but only Builders get
  // the discipline-matching layer since only they have a persistent profile).
  const [discipline, setDiscipline] = React.useState<Discipline | null>(() => {
    if (!isBuilder) return null
    return (localStorage.getItem(DISCIPLINE_KEY) as Discipline | null) ?? null
  })

  function selectDiscipline(d: Discipline | null) {
    setDiscipline(d)
    if (d) localStorage.setItem(DISCIPLINE_KEY, d)
    else localStorage.removeItem(DISCIPLINE_KEY)
  }

  const listings = isBuilder ? rankByDiscipline(SEED_OPPORTUNITIES, discipline) : SEED_OPPORTUNITIES

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-xl font-semibold text-dark-text">Opportunities</h1>
      </div>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Internships and fellowships in collaboration with <span className="text-white/70">edugrants</span>
      </p>

      {isBuilder && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => selectDiscipline(null)}
            className={`font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150 ${
              discipline === null
                ? 'text-white bg-white/10 border-white/20'
                : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            All disciplines
          </button>
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => selectDiscipline(d)}
              className={`font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                discipline === d
                  ? 'text-corn-500 bg-corn-700/15 border-corn-700/30'
                  : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {listings.map((op) => (
          <OpportunityCard key={op.id} opportunity={op} matched={isBuilder && isMatch(op, discipline)} />
        ))}
      </div>
    </div>
  )
}
