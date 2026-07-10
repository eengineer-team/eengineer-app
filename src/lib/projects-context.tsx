import * as React from 'react'
import { ME_ID } from '@/lib/profile-data'
import {
  SEED_PROJECTS,
  ME_PROJECT_ID,
  type Project,
  type ProjectKind,
  type TeamMember,
  type ProjectStat,
  type SupportingMaterial,
} from '@/lib/projects-data'

// In-memory project store, same pattern/caveat as profiles-context.tsx: only
// the signed-in Builder's own project (ownerId === ME_ID) is ever editable
// from here; every "mine" mutation enforces that instead of trusting the
// caller. Actions that apply to any project (feedback/join/follow) take an
// explicit id since they can target someone else's.

interface ProjectsContextValue {
  projects: Project[]
  getProject: (id: string) => Project | undefined
  getProjectByOwner: (ownerId: string) => Project | undefined
  myProject: Project
  setName: (name: string) => void
  setDescription: (description: string) => void
  setThumbnail: (url: string) => void
  setCover: (url: string) => void
  setLink: (link: string) => void
  setKind: (kind: ProjectKind) => void
  setTelegramUrl: (url: string) => void
  setInstagramUrl: (url: string) => void
  addStat: (label: string, value: string) => void
  removeStat: (id: string) => void
  addSupportingMaterial: (label: string, url: string) => void
  removeSupportingMaterial: (id: string) => void
  setOpenToRecruitment: (open: boolean) => void
  addTeamMember: (name: string, role: string) => void
  removeTeamMember: (id: string) => void
  toggleJoinRequest: (projectId: string, requesterName: string) => void
  toggleFollow: (projectId: string) => void
  addFeedback: (projectId: string, fromName: string, text: string) => void
}

const ProjectsContext = React.createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>(SEED_PROJECTS)

  const getProject = React.useCallback((id: string) => projects.find((p) => p.id === id), [projects])
  const getProjectByOwner = React.useCallback(
    (ownerId: string) => projects.find((p) => p.ownerId === ownerId),
    [projects]
  )

  // Seeded once and never removed, so this is always defined — same
  // guarantee ME_ID's BuilderProfile gives profiles-context.
  const myProject = projects.find((p) => p.id === ME_PROJECT_ID) ?? projects.find((p) => p.ownerId === ME_ID)!

  const updateMine = React.useCallback((fn: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.ownerId === ME_ID ? fn(p) : p)))
  }, [])

  const setName = React.useCallback((name: string) => updateMine((p) => ({ ...p, name })), [updateMine])
  const setDescription = React.useCallback(
    (description: string) => updateMine((p) => ({ ...p, description })),
    [updateMine]
  )
  const setThumbnail = React.useCallback(
    (thumbnailUrl: string) => updateMine((p) => ({ ...p, thumbnailUrl })),
    [updateMine]
  )
  const setCover = React.useCallback((coverUrl: string) => updateMine((p) => ({ ...p, coverUrl })), [updateMine])
  const setLink = React.useCallback((link: string) => updateMine((p) => ({ ...p, link })), [updateMine])
  const setKind = React.useCallback((kind: ProjectKind) => updateMine((p) => ({ ...p, kind })), [updateMine])
  const setTelegramUrl = React.useCallback(
    (telegramUrl: string) => updateMine((p) => ({ ...p, telegramUrl })),
    [updateMine]
  )
  const setInstagramUrl = React.useCallback(
    (instagramUrl: string) => updateMine((p) => ({ ...p, instagramUrl })),
    [updateMine]
  )

  const addStat = React.useCallback(
    (label: string, value: string) => {
      const trimmedLabel = label.trim()
      const trimmedValue = value.trim()
      if (!trimmedLabel || !trimmedValue) return
      const stat: ProjectStat = { id: `stat-${Date.now()}`, label: trimmedLabel, value: trimmedValue }
      updateMine((p) => ({ ...p, stats: [...p.stats, stat] }))
    },
    [updateMine]
  )
  const removeStat = React.useCallback(
    (id: string) => updateMine((p) => ({ ...p, stats: p.stats.filter((s) => s.id !== id) })),
    [updateMine]
  )

  const addSupportingMaterial = React.useCallback(
    (label: string, url: string) => {
      const trimmedLabel = label.trim()
      const trimmedUrl = url.trim()
      if (!trimmedLabel || !trimmedUrl) return
      const material: SupportingMaterial = { id: `mat-${Date.now()}`, label: trimmedLabel, url: trimmedUrl }
      updateMine((p) => ({ ...p, supportingMaterials: [...p.supportingMaterials, material] }))
    },
    [updateMine]
  )
  const removeSupportingMaterial = React.useCallback(
    (id: string) =>
      updateMine((p) => ({ ...p, supportingMaterials: p.supportingMaterials.filter((m) => m.id !== id) })),
    [updateMine]
  )

  const setOpenToRecruitment = React.useCallback(
    (openToRecruitment: boolean) => updateMine((p) => ({ ...p, openToRecruitment })),
    [updateMine]
  )

  const addTeamMember = React.useCallback(
    (name: string, role: string) => {
      const trimmedName = name.trim()
      if (!trimmedName) return
      const member: TeamMember = { id: `team-${Date.now()}`, name: trimmedName, role: role.trim() || 'Member' }
      updateMine((p) => ({ ...p, team: [...p.team, member] }))
    },
    [updateMine]
  )
  const removeTeamMember = React.useCallback(
    (id: string) => updateMine((p) => ({ ...p, team: p.team.filter((m) => m.id !== id) })),
    [updateMine]
  )

  // Toggle so asking-to-join is reversible (same idea as toggleConnect in
  // profiles-context) — requesterName stands in for a real user id until
  // there's an account-linked identity to key this off instead.
  const toggleJoinRequest = React.useCallback((projectId: string, requesterName: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const already = p.joinRequests.includes(requesterName)
        return {
          ...p,
          joinRequests: already
            ? p.joinRequests.filter((n) => n !== requesterName)
            : [...p.joinRequests, requesterName],
        }
      })
    )
  }, [])

  const toggleFollow = React.useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const already = p.followerIds.includes(ME_ID)
        return {
          ...p,
          followerIds: already ? p.followerIds.filter((id) => id !== ME_ID) : [...p.followerIds, ME_ID],
        }
      })
    )
  }, [])

  // Feedback is visible to the owner, same "reason always shown" principle
  // as profile endorsements — never hidden or anonymous.
  const addFeedback = React.useCallback((projectId: string, fromName: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, feedback: [{ id: `fb-${Date.now()}`, fromName, text: trimmed }, ...p.feedback] }
          : p
      )
    )
  }, [])

  const value = React.useMemo(
    () => ({
      projects,
      getProject,
      getProjectByOwner,
      myProject,
      setName,
      setDescription,
      setThumbnail,
      setCover,
      setLink,
      setKind,
      setTelegramUrl,
      setInstagramUrl,
      addStat,
      removeStat,
      addSupportingMaterial,
      removeSupportingMaterial,
      setOpenToRecruitment,
      addTeamMember,
      removeTeamMember,
      toggleJoinRequest,
      toggleFollow,
      addFeedback,
    }),
    [
      projects,
      getProject,
      getProjectByOwner,
      myProject,
      setName,
      setDescription,
      setThumbnail,
      setCover,
      setLink,
      setKind,
      setTelegramUrl,
      setInstagramUrl,
      addStat,
      removeStat,
      addSupportingMaterial,
      removeSupportingMaterial,
      setOpenToRecruitment,
      addTeamMember,
      removeTeamMember,
      toggleJoinRequest,
      toggleFollow,
      addFeedback,
    ]
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects() {
  const ctx = React.useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
