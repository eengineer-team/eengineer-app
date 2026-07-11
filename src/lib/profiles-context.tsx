import * as React from 'react'
import { SEED_PROFILES, ME_ID, type BuilderProfile, type ProjectEntry, type ExperienceEntry } from '@/lib/profile-data'
import type { Discipline } from '@/lib/community-data'
import { usePersistentState } from '@/lib/use-persistent-state'

// In-memory profile store shared across the list/detail routes. Same caveat
// as auth-context.tsx: this is mock state, not a backend — see PROGRESS.md.
// Only the ME_ID profile is ever editable by the current session; every
// mutation below enforces that instead of trusting the caller.

interface ProfilesContextValue {
  profiles: BuilderProfile[]
  getProfile: (id: string) => BuilderProfile | undefined
  rateSkill: (skillName: string, proficiency: number) => void
  addSkill: (skillName: string) => void
  addProject: (project: Omit<ProjectEntry, 'id'>) => void
  addExperience: (entry: Omit<ExperienceEntry, 'id'>) => void
  setBackground: (backgroundId: string) => void
  setName: (name: string) => void
  setBio: (bio: string) => void
  setAvatar: (avatarUrl: string) => void
  setDiscipline: (discipline: Discipline) => void
  setOpenToWork: (openToWork: boolean) => void
  setInterests: (interests: string[]) => void
  addEndorsement: (targetProfileId: string, targetType: 'skill' | 'project', targetName: string, reason: string, fromName: string) => void
  toggleConnect: (targetProfileId: string) => void
}

const ProfilesContext = React.createContext<ProfilesContextValue | null>(null)

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = usePersistentState<BuilderProfile[]>('ee:profiles', SEED_PROFILES)

  const getProfile = React.useCallback((id: string) => profiles.find((p) => p.id === id), [profiles])

  const updateMe = React.useCallback((fn: (p: BuilderProfile) => BuilderProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === ME_ID ? fn(p) : p)))
  }, [])

  const rateSkill = React.useCallback((skillName: string, proficiency: number) => {
    updateMe((p) => ({
      ...p,
      skills: p.skills.map((s) => (s.name === skillName ? { ...s, proficiency } : s)),
    }))
  }, [updateMe])

  const addSkill = React.useCallback((skillName: string) => {
    const trimmed = skillName.trim()
    if (!trimmed) return
    updateMe((p) => {
      if (p.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return p
      return { ...p, skills: [...p.skills, { name: trimmed, proficiency: 3 }] }
    })
  }, [updateMe])

  const addProject = React.useCallback((project: Omit<ProjectEntry, 'id'>) => {
    updateMe((p) => ({
      ...p,
      projects: [{ ...project, id: `p-me-${Date.now()}` }, ...p.projects],
    }))
  }, [updateMe])

  const setBackground = React.useCallback((backgroundId: string) => {
    updateMe((p) => ({ ...p, backgroundId }))
  }, [updateMe])

  // Renames the ME profile — this is the source Avatar/Profiles/Community
  // read from. Settings.tsx also calls auth-context's updateName alongside
  // this so the header greeting ("Hello, X") never drifts out of sync with
  // the profile card's displayed name.
  const setName = React.useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    updateMe((p) => ({ ...p, name: trimmed }))
  }, [updateMe])

  const setBio = React.useCallback((bio: string) => {
    updateMe((p) => ({ ...p, bio }))
  }, [updateMe])

  const addExperience = React.useCallback((entry: Omit<ExperienceEntry, 'id'>) => {
    updateMe((p) => ({
      ...p,
      experience: [{ ...entry, id: `x-me-${Date.now()}` }, ...p.experience],
    }))
  }, [updateMe])

  const setAvatar = React.useCallback((avatarUrl: string) => {
    updateMe((p) => ({ ...p, avatarUrl }))
  }, [updateMe])

  const setDiscipline = React.useCallback((discipline: Discipline) => {
    updateMe((p) => ({ ...p, discipline }))
  }, [updateMe])

  const setOpenToWork = React.useCallback((openToWork: boolean) => {
    updateMe((p) => ({ ...p, openToWork }))
  }, [updateMe])

  const setInterests = React.useCallback((interests: string[]) => {
    updateMe((p) => ({ ...p, interests }))
  }, [updateMe])

  // Endorsing is the one write any Builder can make on someone else's
  // profile — reason is required by the caller-side dialog, enforced again
  // here as a last line of defense.
  const addEndorsement = React.useCallback(
    (targetProfileId: string, targetType: 'skill' | 'project', targetName: string, reason: string, fromName: string) => {
      const trimmedReason = reason.trim()
      if (!trimmedReason) return
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetProfileId
            ? {
                ...p,
                endorsements: [
                  { id: `end-${Date.now()}`, fromName, targetType, targetName, reason: trimmedReason },
                  ...p.endorsements,
                ],
              }
            : p
        )
      )
    },
    []
  )

  // Connect request toggle — mirrors My Network's request/withdraw pattern,
  // but scoped to a single profile (no accept/decline here: the target isn't
  // "yours" to manage, only your own outgoing request is).
  const toggleConnect = React.useCallback((targetProfileId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== targetProfileId) return p
        if (p.connectStatus === 'connected') return p
        return { ...p, connectStatus: p.connectStatus === 'requested' ? 'none' : 'requested' }
      })
    )
  }, [])

  const value = React.useMemo(
    () => ({
      profiles,
      getProfile,
      rateSkill,
      addSkill,
      addProject,
      addExperience,
      setBackground,
      setName,
      setBio,
      setAvatar,
      setDiscipline,
      setOpenToWork,
      setInterests,
      addEndorsement,
      toggleConnect,
    }),
    [
      profiles,
      getProfile,
      rateSkill,
      addSkill,
      addProject,
      addExperience,
      setBackground,
      setName,
      setBio,
      setAvatar,
      setDiscipline,
      setOpenToWork,
      setInterests,
      addEndorsement,
      toggleConnect,
    ]
  )

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>
}

export function useProfiles() {
  const ctx = React.useContext(ProfilesContext)
  if (!ctx) throw new Error('useProfiles must be used within ProfilesProvider')
  return ctx
}
