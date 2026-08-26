import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  X,
  Sparkles,
  ShieldCheck,
  FolderGit2,
  Award,
  ArrowRight,
  Edit3,
  Users,
  UserCheck,
  Compass,
  UserPlus,
  Clock,
  Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { DISCIPLINES } from '@/lib/community-data'
import { getDisciplineIcon } from '@/lib/discipline-icons'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LabelCaps } from '@/components/ui/label-caps'
import { VerifiedBadge } from '@/components/profile/VerifiedBadge'
import { ReputationBadge } from '@/components/profile/ReputationBadge'
import { cn } from '@/lib/utils'

function displayName(user: ReturnType<typeof useAuth>['user'], name: string) {
  return name === 'You' && user?.status === 'builder' ? user.name : name
}

type MainTab = 'network' | 'explore'
type SortOption = 'reputation' | 'name' | 'projects'

export function ProfilesList() {
  const { user } = useAuth()
  const { profiles, incomingRequests, respondToRequest, toggleConnect } = useProfiles()

  const [activeTab, setActiveTab] = React.useState<MainTab>('network')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedDiscipline, setSelectedDiscipline] = React.useState<string>('all')
  const [onlyOnline, setOnlyOnline] = React.useState(false)
  const [onlyVerified, setOnlyVerified] = React.useState(false)
  const [onlyWithProjects, setOnlyWithProjects] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<SortOption>('reputation')

  // Identify current user's profile
  const myProfile = React.useMemo(() => {
    return profiles.find((p) => p.id === ME_ID)
  }, [profiles])

  // Connected peers (My Network)
  const connectedProfiles = React.useMemo(() => {
    return profiles.filter((p) => p.id !== ME_ID && p.connectStatus === 'connected')
  }, [profiles])

  // Pending requested connections
  const requestedProfiles = React.useMemo(() => {
    return profiles.filter((p) => p.id !== ME_ID && p.connectStatus === 'requested')
  }, [profiles])

  // Recommendations for empty network (same discipline or top reputation)
  const suggestedProfiles = React.useMemo(() => {
    return profiles
      .filter((p) => p.id !== ME_ID && p.connectStatus === 'none')
      .sort((a, b) => {
        if (myProfile && a.discipline === myProfile.discipline && b.discipline !== myProfile.discipline) return -1
        if (myProfile && b.discipline === myProfile.discipline && a.discipline !== myProfile.discipline) return 1
        return (b.reputationPoints || 0) - (a.reputationPoints || 0)
      })
      .slice(0, 3)
  }, [profiles, myProfile])

  // Other builders for Explore tab
  const otherProfiles = React.useMemo(() => {
    return profiles.filter((p) => p.id !== ME_ID)
  }, [profiles])

  // Filter & sort explore profiles
  const filteredExploreProfiles = React.useMemo(() => {
    let result = otherProfiles

    // 1. Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) => {
        const name = displayName(user, p.name).toLowerCase()
        const bio = p.bio.toLowerCase()
        const discipline = p.discipline.toLowerCase()
        const matchSkills = p.skills.some((s) => s.name.toLowerCase().includes(q))
        const matchProjects = p.projects.some((pr) => pr.title.toLowerCase().includes(q))
        const matchExperience = p.experience.some(
          (e) => e.role.toLowerCase().includes(q) || e.organization.toLowerCase().includes(q)
        )
        return (
          name.includes(q) ||
          bio.includes(q) ||
          discipline.includes(q) ||
          matchSkills ||
          matchProjects ||
          matchExperience
        )
      })
    }

    // 2. Discipline Filter
    if (selectedDiscipline !== 'all') {
      result = result.filter((p) => p.discipline.toLowerCase() === selectedDiscipline.toLowerCase())
    }

    // 3. Online Filter
    if (onlyOnline) {
      result = result.filter((p) => p.online)
    }

    // 4. Verified Filter
    if (onlyVerified) {
      result = result.filter((p) => p.verified)
    }

    // 5. Projects Filter
    if (onlyWithProjects) {
      result = result.filter((p) => p.projects.length > 0)
    }

    // 6. Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'reputation') {
        return (b.reputationPoints || 0) - (a.reputationPoints || 0)
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'projects') {
        return b.projects.length - a.projects.length
      }
      return 0
    })

    return result
  }, [otherProfiles, searchQuery, selectedDiscipline, onlyOnline, onlyVerified, onlyWithProjects, sortBy, user])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedDiscipline('all')
    setOnlyOnline(false)
    setOnlyVerified(false)
    setOnlyWithProjects(false)
    setSortBy('reputation')
  }

  return (
    <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-8 max-w-[960px] mx-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <LabelCaps className="text-gold-dark mb-1.5 block">Network & Teammates</LabelCaps>
          <div className="flex items-center gap-2.5">
            <Users size={22} className="text-gold-dark" />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-dark-text">
              Builder Network
            </h1>
          </div>
          <p className="font-sans text-[0.8125rem] text-dark-muted mt-1">
            Manage your peer connections and collaborate with engineers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/settings">
            <Button variant="shell" size="sm" className="gap-1.5 text-xs font-medium">
              <Edit3 size={13} />
              <span>Edit My Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. "Your Profile" Spotlight Banner */}
      {myProfile && (
        <div className="relative overflow-hidden rounded-2xl border border-gold-dark/30 bg-gradient-to-r from-gold-dark/10 via-dark-surface to-dark-surface p-5 mb-7 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <Avatar
                  name={displayName(user, myProfile.name)}
                  src={myProfile.avatarUrl}
                  theme="dashboard"
                  size="lg"
                  className="border-2 border-gold-dark/40 shadow-md"
                />
                {myProfile.online && (
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-surface"
                    title="Online now"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-display text-base font-bold text-dark-text">
                    {displayName(user, myProfile.name)}
                  </span>
                  <span className="text-[11px] font-mono text-gold-dark font-medium bg-gold-dark/15 px-2 py-0.5 rounded-full border border-gold-dark/30">
                    You
                  </span>
                  {myProfile.verified && <VerifiedBadge provider={myProfile.verifiedVia} />}
                  <ReputationBadge
                    tier={myProfile.reputationTier}
                    points={myProfile.reputationPoints}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-dark-muted font-sans flex-wrap">
                  <span className="font-semibold text-dark-text">{myProfile.discipline}</span>
                  <span>•</span>
                  <span>
                    <strong className="text-dark-text">{connectedProfiles.length}</strong> Connections
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-dark-text">{myProfile.skills.length}</strong> Skills
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-dark-text">{myProfile.projects.length}</strong> Projects
                  </span>
                </div>
              </div>
            </div>

            <Link to="/dashboard/settings" className="sm:ml-auto w-full sm:w-auto">
              <Button
                variant="accent"
                size="sm"
                className="w-full sm:w-auto gap-2 text-xs font-semibold px-4"
              >
                <span>Edit Profile & Skills</span>
                <ArrowRight size={13} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Primary Navigation Tabs: My Network vs Explore */}
      <div className="flex items-center gap-2 border-b border-white/8 mb-6 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('network')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-semibold transition-all duration-150 cursor-pointer',
            activeTab === 'network'
              ? 'bg-gold-dark/15 text-gold-dark border border-gold-dark/30 shadow-[0_0_15px_rgba(199,154,58,0.1)]'
              : 'text-dark-muted hover:text-dark-text hover:bg-white/5 border border-transparent'
          )}
        >
          <UserCheck size={16} />
          <span>My Network</span>
          <span
            className={cn(
              'font-mono text-xs px-2 py-0.5 rounded-full',
              activeTab === 'network'
                ? 'bg-gold-dark/25 text-gold-dark font-bold'
                : 'bg-white/5 text-dark-muted'
            )}
          >
            {connectedProfiles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-semibold transition-all duration-150 cursor-pointer',
            activeTab === 'explore'
              ? 'bg-gold-dark/15 text-gold-dark border border-gold-dark/30 shadow-[0_0_15px_rgba(199,154,58,0.1)]'
              : 'text-dark-muted hover:text-dark-text hover:bg-white/5 border border-transparent'
          )}
        >
          <Compass size={16} />
          <span>Explore Builders</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/5 text-dark-muted">
            {otherProfiles.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY NETWORK (Default View)                                          */}
      {/* ========================================================================= */}
      {activeTab === 'network' && (
        <div className="flex flex-col gap-6">
          {/* Incoming Requests Banner */}
          {incomingRequests && incomingRequests.length > 0 && (
            <div className="p-4 rounded-xl bg-gold-dark/10 border border-gold-dark/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gold-dark font-sans text-xs font-semibold">
                <UserPlus size={15} />
                <span>Incoming Connection Requests ({incomingRequests.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-surface2 border border-white/8"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-sans text-xs font-semibold text-dark-text truncate">
                        {req.requesterName}
                      </div>
                      <div className="font-sans text-[11px] text-dark-muted truncate">
                        {req.requesterDiscipline}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="accent"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() => respondToRequest(req.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="shell"
                        className="h-7 text-[11px] px-2"
                        onClick={() => respondToRequest(req.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Sent Requests */}
          {requestedProfiles.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-dark-muted font-sans text-xs">
                <Clock size={14} className="text-amber-400" />
                <span>
                  You have <strong>{requestedProfiles.length}</strong> pending connection request
                  {requestedProfiles.length > 1 ? 's' : ''} sent.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {requestedProfiles.map((p) => (
                  <Link
                    key={p.id}
                    to={`/dashboard/profiles/${p.id}`}
                    className="text-xs font-medium text-dark-text hover:text-gold-dark underline"
                  >
                    {displayName(user, p.name)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Connected Profiles List */}
          {connectedProfiles.length > 0 ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-base font-semibold text-dark-text">
                  Your Connected Peers ({connectedProfiles.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedProfiles.map((p) => {
                  const name = displayName(user, p.name)
                  const DisciplineIcon = getDisciplineIcon(p.discipline)

                  return (
                    <Link
                      key={p.id}
                      to={`/dashboard/profiles/${p.id}`}
                      className="group flex flex-col justify-between bg-dark-surface border border-white/8 hover:border-gold-dark/40 hover:bg-white/[0.02] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer text-left"
                    >
                      <div>
                        <div className="flex items-start gap-3 mb-3.5">
                          <div className="relative flex-shrink-0 mt-0.5">
                            <Avatar name={name} src={p.avatarUrl} theme="dashboard" size="md" />
                            {p.online && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-surface"
                                title="Online now"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 leading-tight mb-1 flex-wrap">
                              <span className="font-sans text-[0.9375rem] font-semibold text-dark-text group-hover:text-gold-dark transition-colors truncate">
                                {name}
                              </span>
                              {p.verified && <VerifiedBadge provider={p.verifiedVia} />}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <ReputationBadge
                                tier={p.reputationTier}
                                points={p.reputationPoints}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="font-sans text-[0.8125rem] text-dark-muted line-clamp-2 leading-relaxed mb-3.5">
                          {p.bio || 'Building future tech on eengineer network.'}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-dark-muted/80 font-mono mb-3.5 pt-2 border-t border-white/6">
                          <span className="flex items-center gap-1">
                            <FolderGit2 size={12} className="text-gold-dark/70" />
                            <span>{p.projects.length} projects</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Award size={12} className="text-gold-dark/70" />
                            <span>{p.endorsements.length} endorsements</span>
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/6 flex items-center justify-between gap-2 flex-wrap">
                        <Chip
                          theme="dashboard"
                          discipline={p.discipline}
                          className="gap-1 px-2 py-0.5 text-[11px]"
                        >
                          <DisciplineIcon size={11} />
                          <span>{p.discipline}</span>
                        </Chip>

                        <span className="text-xs font-sans text-emerald-400 flex items-center gap-1">
                          <Check size={12} />
                          <span>Connected</span>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Empty Network State + Suggestions */
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-dark-surface rounded-2xl border border-white/8">
                <div className="w-14 h-14 rounded-full bg-gold-dark/10 border border-gold-dark/20 flex items-center justify-center text-gold-dark mb-4 shadow-[0_0_20px_rgba(199,154,58,0.15)]">
                  <Users size={26} />
                </div>
                <h3 className="font-display text-lg font-bold text-dark-text mb-1.5">
                  Your network is empty yet
                </h3>
                <p className="font-sans text-xs sm:text-[0.8125rem] text-dark-muted max-w-md mb-6 leading-relaxed">
                  Connect with peer engineers to share projects, exchange endorsements, and build
                  reputation together on the platform.
                </p>
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => setActiveTab('explore')}
                  className="gap-2 text-xs font-semibold px-5"
                >
                  <Compass size={15} />
                  <span>Explore & Find Teammates</span>
                </Button>
              </div>

              {/* Recommended Engineers Section */}
              {suggestedProfiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div>
                      <LabelCaps className="text-gold-dark mb-0.5 block">Recommended For You</LabelCaps>
                      <h4 className="font-display text-sm font-semibold text-dark-text">
                        Top engineers in your field
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('explore')}
                      className="font-sans text-xs text-gold-dark hover:underline flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {suggestedProfiles.map((p) => {
                      const name = displayName(user, p.name)
                      const DisciplineIcon = getDisciplineIcon(p.discipline)

                      return (
                        <div
                          key={p.id}
                          className="flex flex-col justify-between p-4 rounded-xl bg-dark-surface border border-white/8 hover:border-gold-dark/30 transition-all text-left"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <Avatar name={name} src={p.avatarUrl} theme="dashboard" size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="font-sans text-xs font-semibold text-dark-text truncate">
                                  {name}
                                </div>
                                <div className="font-sans text-[10.5px] text-dark-muted flex items-center gap-1">
                                  <DisciplineIcon size={10} />
                                  <span>{p.discipline}</span>
                                </div>
                              </div>
                            </div>
                            <p className="font-sans text-[11px] text-dark-muted line-clamp-2 mb-3">
                              {p.bio || 'Building future tech on eengineer network.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
                            <Link
                              to={`/dashboard/profiles/${p.id}`}
                              className="text-[11px] font-sans text-gold-dark hover:underline"
                            >
                              View Profile
                            </Link>

                            <Button
                              size="sm"
                              variant="shell"
                              className="h-6.5 text-[11px] px-2 gap-1"
                              onClick={() => toggleConnect(p.id)}
                            >
                              <UserPlus size={11} />
                              <span>Connect</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPLORE & SEARCH DIRECTORY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'explore' && (
        <div className="flex flex-col gap-5">
          {/* Search & Filters Toolbar */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 flex-col sm:flex-row">
              <div className="relative flex-1 w-full">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted/60 pointer-events-none"
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skills (React, Python, CAD), company, or role…"
                  className="pl-10 pr-9 bg-white/5 border-white/10 text-dark-text placeholder:text-dark-muted/40 focus:border-gold-dark/50 focus:bg-white/[0.08] transition-all h-10.5 text-sm rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text p-1 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-sans text-xs text-dark-muted whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-dark-surface2 border border-white/10 text-dark-text text-xs rounded-lg px-2.5 py-2 font-sans focus:outline-none focus:border-gold-dark/40 cursor-pointer"
                >
                  <option value="reputation">Top Reputation</option>
                  <option value="projects">Most Projects</option>
                  <option value="name">Alphabetical (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Discipline Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedDiscipline('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                  selectedDiscipline === 'all'
                    ? 'bg-gold-dark/15 text-gold-dark border border-gold-dark/30 shadow-sm'
                    : 'text-dark-muted hover:text-dark-text hover:bg-white/5 border border-transparent'
                )}
              >
                <Sparkles size={13} />
                <span>All Disciplines</span>
                <span className="font-mono text-[10px] opacity-70 ml-0.5">({otherProfiles.length})</span>
              </button>

              {DISCIPLINES.map((d) => {
                const Icon = getDisciplineIcon(d)
                const count = otherProfiles.filter((p) => p.discipline === d).length
                const isActive = selectedDiscipline.toLowerCase() === d.toLowerCase()

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDiscipline(d)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                      isActive
                        ? 'bg-gold-dark/15 text-gold-dark border border-gold-dark/30 shadow-sm'
                        : 'text-dark-muted hover:text-dark-text hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <Icon size={13} />
                    <span>{d}</span>
                    {count > 0 && (
                      <span className="font-mono text-[10px] opacity-70 ml-0.5">({count})</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/6 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOnlyOnline(!onlyOnline)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-colors border cursor-pointer',
                    onlyOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-white/5 text-dark-muted border-white/8 hover:text-dark-text hover:bg-white/10'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-colors border cursor-pointer',
                    onlyVerified
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-white/5 text-dark-muted border-white/8 hover:text-dark-text hover:bg-white/10'
                  )}
                >
                  <ShieldCheck size={13} />
                  <span>Verified Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyWithProjects(!onlyWithProjects)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-colors border cursor-pointer',
                    onlyWithProjects
                      ? 'bg-gold-dark/20 text-gold-dark border-gold-dark/40'
                      : 'bg-white/5 text-dark-muted border-white/8 hover:text-dark-text hover:bg-white/10'
                  )}
                >
                  <FolderGit2 size={13} />
                  <span>Has Projects</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-dark-muted font-sans ml-auto">
                <span>
                  Found <strong className="text-dark-text">{filteredExploreProfiles.length}</strong> builders
                </span>
                {(searchQuery || selectedDiscipline !== 'all' || onlyOnline || onlyVerified || onlyWithProjects) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-gold-dark hover:underline font-medium ml-1"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Builders Grid */}
          {filteredExploreProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExploreProfiles.map((p) => {
                const name = displayName(user, p.name)
                const DisciplineIcon = getDisciplineIcon(p.discipline)
                const isConnected = p.connectStatus === 'connected'
                const isRequested = p.connectStatus === 'requested'

                return (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between bg-dark-surface border border-white/8 hover:border-gold-dark/40 hover:bg-white/[0.02] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left"
                  >
                    <div>
                      {/* Top Row */}
                      <div className="flex items-start gap-3 mb-3.5">
                        <Link to={`/dashboard/profiles/${p.id}`} className="relative flex-shrink-0 mt-0.5">
                          <Avatar name={name} src={p.avatarUrl} theme="dashboard" size="md" />
                          {p.online && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-surface"
                              title="Online now"
                            />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/dashboard/profiles/${p.id}`}
                            className="flex items-center gap-1.5 leading-tight mb-1 flex-wrap group-hover:text-gold-dark"
                          >
                            <span className="font-sans text-[0.9375rem] font-semibold text-dark-text transition-colors truncate">
                              {name}
                            </span>
                            {p.verified && <VerifiedBadge provider={p.verifiedVia} />}
                          </Link>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <ReputationBadge
                              tier={p.reputationTier}
                              points={p.reputationPoints}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="font-sans text-[0.8125rem] text-dark-muted line-clamp-2 leading-relaxed mb-3.5">
                        {p.bio || 'Building future tech on eengineer network.'}
                      </p>

                      {/* Projects & Endorsements */}
                      <div className="flex items-center gap-3 text-[11px] text-dark-muted/80 font-mono mb-3.5 pt-2 border-t border-white/6">
                        <span className="flex items-center gap-1">
                          <FolderGit2 size={12} className="text-gold-dark/70" />
                          <span>{p.projects.length} projects</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Award size={12} className="text-gold-dark/70" />
                          <span>{p.endorsements.length} endorsements</span>
                        </span>
                      </div>
                    </div>

                    {/* Footer: Discipline Chip & Action */}
                    <div className="pt-3 border-t border-white/6 flex items-center justify-between gap-2 flex-wrap">
                      <Chip
                        theme="dashboard"
                        discipline={p.discipline}
                        className="gap-1 px-2 py-0.5 text-[11px]"
                      >
                        <DisciplineIcon size={11} />
                        <span>{p.discipline}</span>
                      </Chip>

                      <div className="flex items-center gap-1.5">
                        {isConnected ? (
                          <span className="text-xs font-sans text-emerald-400 flex items-center gap-1">
                            <Check size={12} />
                            <span>Connected</span>
                          </span>
                        ) : isRequested ? (
                          <span className="text-xs font-sans text-amber-400/80 flex items-center gap-1">
                            <Clock size={12} />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="shell"
                            className="h-7 text-xs px-2.5 gap-1 text-gold-dark hover:bg-gold-dark/15 border-gold-dark/30"
                            onClick={() => toggleConnect(p.id)}
                          >
                            <UserPlus size={12} />
                            <span>Connect</span>
                          </Button>
                        )}

                        <Link
                          to={`/dashboard/profiles/${p.id}`}
                          className="p-1 rounded text-dark-muted hover:text-gold-dark transition-colors"
                          title="View Profile"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-dark-surface rounded-2xl border border-white/6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-dark-muted mb-3">
                <Search size={22} />
              </div>
              <h3 className="font-display text-base font-semibold text-dark-text mb-1">
                No builders found
              </h3>
              <p className="font-sans text-xs text-dark-muted max-w-sm mb-4">
                No engineers matched your current search filters{' '}
                {searchQuery && <span className="text-gold-dark">"{searchQuery}"</span>}.
              </p>
              <Button variant="shell" size="sm" onClick={resetFilters} className="text-xs">
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default ProfilesList
