import { LabelCaps } from '@/components/ui/label-caps'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Real sponsor now, teaser slots for later — per founder spec: the blurred
// tiles aren't broken placeholders, they're deliberate ("obscure and
// exciting, more coming"). Track is duplicated back-to-back and animated
// -50% so the loop is seamless; hovering anywhere pauses it (CSS
// animation-play-state, not JS) so a tile can actually be read/hovered.
interface SponsorTile {
  name: string
  logo: string | null
  blurb: string
}

const SPONSORS: SponsorTile[] = [
  // Black-ladder variant: the marquee sits on the cornsilk landing background,
  // where the dark-mode mark's cream ladder was nearly invisible and only the
  // gold cap read. The dashboard (OpportunityDetail) still uses the cream one
  // -- it's on a dark surface, where that's the correct variant.
  { name: 'Edugrants', logo: '/edugrants-mark-black-transparent.png', blurb: 'Edugrants — scholarship & opportunity discovery for students' },
  {
    name: 'Pizik Lab',
    logo: '/pizik-mark-transparent.png',
    blurb: 'Pizik Lab — hands-on physics experiments and science outreach across Uzbekistan',
  },
  {
    name: 'Muhandiss.uz',
    logo: '/muhandiss-mark-transparent.png',
    blurb: "Muhandiss.uz — Uzbek-language engineering community: translated articles, mentorship, and internship access",
  },
  { name: 'Partner C', logo: null, blurb: 'More partners coming soon' },
]

function Tile({ sponsor }: { sponsor: SponsorTile }) {
  return (
    <Tooltip label={sponsor.blurb}>
      <div
        className={cn(
          'flex items-center justify-center w-[132px] h-[72px] rounded-lg border flex-shrink-0 transition-all duration-150',
          sponsor.logo
            ? 'border-corn-900/12 bg-white/40 hover:border-corn-900/25'
            : 'border-corn-900/8 bg-corn-900/[0.03] hover:bg-corn-900/[0.06]'
        )}
      >
        {sponsor.logo ? (
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-[36px] max-w-[88px] object-contain" />
        ) : (
          // Obscured: a soft blurred glyph, not a real logo -- reads as
          // "something's there" without pretending to be a real partner.
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-corn-900/15 blur-[3px] select-none"
          />
        )}
      </div>
    </Tooltip>
  )
}

// Tile width + flex gap, kept in sync with the classes on Tile/the track
// below. Only used to work out how many times the list has to repeat.
const TILE_PITCH = 132 + 16

// The animation translates the track by -50%, which only looks seamless if
// ONE half is at least as wide as the viewport -- otherwise the half that
// scrolled off hasn't been replaced yet and you get a blank gap on the right
// before it snaps back. Five sponsors is ~740px, narrower than any desktop
// screen, so the list is repeated until a half comfortably covers an
// ultrawide monitor. Tiles are cheap; a wrong-looking loop is not.
// 3440 is the widest common desktop (ultrawide); anything above that is rare
// enough to not be worth more DOM nodes.
const HALF_MIN_WIDTH = 3500
const REPEATS = Math.max(2, Math.ceil(HALF_MIN_WIDTH / (SPONSORS.length * TILE_PITCH)))

// The keyframe travels a fixed -50%, so widening the track without touching
// the duration would speed the scroll up by exactly the repeat factor. Scale
// the duration with it to hold the perceived speed at the original ~26px/s.
const BASE_DURATION_S = 28
const DURATION_S = BASE_DURATION_S * REPEATS

export function SponsorMarquee() {
  const half = Array.from({ length: REPEATS }, () => SPONSORS).flat()
  const track = [...half, ...half]

  return (
    <section className="px-5 sm:px-10 py-10 border-t border-[#2A2118]/8">
      <LabelCaps theme="welcome" className="block mb-4">
        Backed by
      </LabelCaps>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          style={{ animationDuration: `${DURATION_S}s` }}
          className="flex gap-4 w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
        >
          {track.map((sponsor, i) => (
            <Tile key={`${sponsor.name}-${i}`} sponsor={sponsor} />
          ))}
        </div>
      </div>
    </section>
  )
}
