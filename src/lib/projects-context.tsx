import * as React from 'react'
import { ME_ID } from '@/lib/profile-data'
import {
  ME_PROJECT_ID,
  type Project,
  type ProjectKind,
  type TeamMember,
  type ProjectStat,
  type SupportingMaterial,
} from '@/lib/projects-data'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/projects'

// Live Supabase-backed project store, same pattern/caveat as
// profiles-context.tsx: only the signed-in Builder's own project
// (ownerId === ME_ID) is ever editable from here; every "mine" mutation
// enforces that instead of trusting the caller. Actions that apply to any
// project (feedback/join/follow) take an explicit id since they can target
// someone else's. RLS enforces the same rule server-side — this is UX, not
// the security boundary.

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
  deleteProject: (id: string) => Promise<void>
}

const ProjectsContext = React.createContext<ProjectsContextValue | null>(null)

// Shown for the signed-in Builder's own project before the first fetch
// resolves (or while signed out) — same "always defined" guarantee the mock
// seed gave callers, so ProjectsHub/ProjectDetail never need a loading branch.
const EMPTY_MY_PROJECT: Project = {
  id: ME_PROJECT_ID,
  ownerId: ME_ID,
  name: '',
  description: '',
  kind: 'other',
  stats: [],
  supportingMaterials: [],
  openToRecruitment: false,
  team: [],
  joinRequests: [],
  followerIds: [],
  feedback: [],
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([])
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setProjects(await api.fetchProjects())
    } catch (err) {
      console.error('Failed to load projects', err)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred — see the note in clubs-context.tsx.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const getProject = React.useCallback((id: string) => projects.find((p) => p.id === id), [projects])
  const getProjectByOwner = React.useCallback(
    (ownerId: string) => projects.find((p) => p.ownerId === ownerId),
    [projects]
  )

  const myProject = projects.find((p) => p.ownerId === ME_ID) ?? EMPTY_MY_PROJECT

  // Applies an optimistic patch to the ME_ID project, then fires the real
  // write. On failure, re-fetches to reconcile local state with the server
  // (RLS-denied writes never crash the UI — see profiles-context's recipe).
  const updateMine = React.useCallback(
    (fn: (p: Project) => Project, write: (uid: string) => Promise<void>) => {
      setProjects((prev) => prev.map((p) => (p.ownerId === ME_ID ? fn(p) : p)))
      const uid = uidRef.current
      if (!uid) return
      write(uid).catch((err) => {
        console.error('Project update failed', err)
        void refresh()
      })
    },
    [refresh]
  )

  const setName = React.useCallback(
    (name: string) => updateMine((p) => ({ ...p, name }), (uid) => api.updateMyProject(uid, { name })),
    [updateMine]
  )
  const setDescription = React.useCallback(
    (description: string) =>
      updateMine((p) => ({ ...p, description }), (uid) => api.updateMyProject(uid, { description })),
    [updateMine]
  )
  const setThumbnail = React.useCallback(
    (thumbnailUrl: string) =>
      updateMine((p) => ({ ...p, thumbnailUrl }), (uid) => api.setThumbnail(uid, thumbnailUrl).then(() => void refresh())),
    [updateMine, refresh]
  )
  const setCover = React.useCallback(
    (coverUrl: string) =>
      updateMine((p) => ({ ...p, coverUrl }), (uid) => api.setCover(uid, coverUrl).then(() => void refresh())),
    [updateMine, refresh]
  )
  const setLink = React.useCallback(
    (link: string) => updateMine((p) => ({ ...p, link }), (uid) => api.updateMyProject(uid, { link })),
    [updateMine]
  )
  const setKind = React.useCallback(
    (kind: ProjectKind) => updateMine((p) => ({ ...p, kind }), (uid) => api.updateMyProject(uid, { kind })),
    [updateMine]
  )
  const setTelegramUrl = React.useCallback(
    (telegramUrl: string) =>
      updateMine((p) => ({ ...p, telegramUrl }), (uid) => api.updateMyProject(uid, { telegram_url: telegramUrl })),
    [updateMine]
  )
  const setInstagramUrl = React.useCallback(
    (instagramUrl: string) =>
      updateMine((p) => ({ ...p, instagramUrl }), (uid) => api.updateMyProject(uid, { instagram_url: instagramUrl })),
    [updateMine]
  )

  const addStat = React.useCallback(
    (label: string, value: string) => {
      const trimmedLabel = label.trim()
      const trimmedValue = value.trim()
      if (!trimmedLabel || !trimmedValue) return
      const stat: ProjectStat = { id: `stat-${Date.now()}`, label: trimmedLabel, value: trimmedValue }
      updateMine(
        (p) => ({ ...p, stats: [...p.stats, stat] }),
        (uid) => api.addStat(uid, trimmedLabel, trimmedValue).then(() => void refresh())
      )
    },
    [updateMine, refresh]
  )
  const removeStat = React.useCallback(
    (id: string) =>
      updateMine((p) => ({ ...p, stats: p.stats.filter((s) => s.id !== id) }), () => api.removeStat(id)),
    [updateMine]
  )

  const addSupportingMaterial = React.useCallback(
    (label: string, url: string) => {
      const trimmedLabel = label.trim()
      const trimmedUrl = url.trim()
      if (!trimmedLabel || !trimmedUrl) return
      const material: SupportingMaterial = { id: `mat-${Date.now()}`, label: trimmedLabel, url: trimmedUrl }
      updateMine(
        (p) => ({ ...p, supportingMaterials: [...p.supportingMaterials, material] }),
        (uid) => api.addSupportingMaterial(uid, trimmedLabel, trimmedUrl).then(() => void refresh())
      )
    },
    [updateMine, refresh]
  )
  const removeSupportingMaterial = React.useCallback(
    (id: string) =>
      updateMine(
        (p) => ({ ...p, supportingMaterials: p.supportingMaterials.filter((m) => m.id !== id) }),
        () => api.removeSupportingMaterial(id)
      ),
    [updateMine]
  )

  const setOpenToRecruitment = React.useCallback(
    (openToRecruitment: boolean) =>
      updateMine(
        (p) => ({ ...p, openToRecruitment }),
        (uid) => api.updateMyProject(uid, { open_to_recruitment: openToRecruitment })
      ),
    [updateMine]
  )

  const addTeamMember = React.useCallback(
    (name: string, role: string) => {
      const trimmedName = name.trim()
      if (!trimmedName) return
      const trimmedRole = role.trim() || 'Member'
      const member: TeamMember = { id: `team-${Date.now()}`, name: trimmedName, role: trimmedRole }
      updateMine(
        (p) => ({ ...p, team: [...p.team, member] }),
        (uid) => api.addTeamMember(uid, trimmedName, trimmedRole).then(() => void refresh())
      )
    },
    [updateMine, refresh]
  )
  const removeTeamMember = React.useCallback(
    (id: string) =>
      updateMine((p) => ({ ...p, team: p.team.filter((m) => m.id !== id) }), () => api.removeTeamMember(id)),
    [updateMine]
  )

  // Toggle so asking-to-join is reversible (same idea as toggleConnect in
  // profiles-context) — requesterName is display copy only; the write is
  // keyed by auth.uid() via api.toggleJoinRequest, never by the name string.
  const toggleJoinRequest = React.useCallback(
    (projectId: string, requesterName: string) => {
      const uid = uidRef.current
      if (!uid) return
      const project = projects.find((p) => p.id === projectId)
      if (!project) return
      const already = project.joinRequests.includes(requesterName)
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p
          return {
            ...p,
            joinRequests: already
              ? p.joinRequests.filter((n) => n !== requesterName)
              : [...p.joinRequests, requesterName],
          }
        })
      )
      api.toggleJoinRequest(uid, projectId, already).catch((err) => {
        console.error('Join request toggle failed', err)
        void refresh()
      })
    },
    [projects, refresh]
  )

  const toggleFollow = React.useCallback(
    (projectId: string) => {
      const uid = uidRef.current
      if (!uid) return
      const project = projects.find((p) => p.id === projectId)
      if (!project) return
      const already = project.followerIds.includes(ME_ID)
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p
          return {
            ...p,
            followerIds: already ? p.followerIds.filter((id) => id !== ME_ID) : [...p.followerIds, ME_ID],
          }
        })
      )
      api.toggleFollow(uid, projectId, already).catch((err) => {
        console.error('Follow toggle failed', err)
        void refresh()
      })
    },
    [projects, refresh]
  )

  // Feedback is visible to the owner, same "reason always shown" principle
  // as profile endorsements — never hidden or anonymous.
  const addFeedback = React.useCallback(
    (projectId: string, fromName: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const uid = uidRef.current
      if (!uid) return
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, feedback: [{ id: `fb-${Date.now()}`, fromName, text: trimmed }, ...p.feedback] }
            : p
        )
      )
      api
        .addFeedback(uid, projectId, trimmed)
        .then(() => void refresh())
        .catch((err) => {
          console.error('Feedback failed', err)
          void refresh()
        })
    },
    [refresh]
  )

  // Optimistic removal, same recipe as updateMine — but rethrows on failure
  // instead of just re-fetching, so the caller (ProjectDetail) knows not to
  // navigate away from a project that's still actually there.
  const deleteProject = React.useCallback(
    async (id: string) => {
      const previous = projects
      setProjects((prev) => prev.filter((p) => p.id !== id))
      try {
        await api.deleteProject(id)
      } catch (err) {
        setProjects(previous)
        throw err
      }
    },
    [projects]
  )

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
      deleteProject,
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
      deleteProject,
    ]
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects() {
  const ctx = React.useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
