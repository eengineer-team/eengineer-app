import * as React from 'react'
import {
  SEED_PROFILES,
  ME_ID,
  MIN_ENDORSEMENT_REASON_LENGTH,
  type BuilderProfile,
  type ProjectEntry,
  type ExperienceEntry,
} from '@/lib/profile-data'
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
  setBackgroundImage: (url: string | undefined) => void
  setName: (name: string) => void
  setBio: (bio: string) => void
  setAvatar: (avatarUrl: string) => void
  setDiscipline: (discipline: Discipline) => void
  setOpenToWork: (openToWork: boolean) => void
  setInterests: (interests: string[]) => void
  setAllowDMs: (allow: boolean) => void
  setBirthdate: (birthdate: string) => void
  setGuardianConsent: (guardianEmail: string) => void
  addEndorsement: (
    targetProfileId: string,
    targetType: 'skill' | 'project',
    targetName: string,
    reason: string,
    fromName: string,
    evidenceUrl?: string
  ) => void
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

  // Picking a solid color clears any photo background — the two are
  // mutually exclusive in the header banner, so switching one off the other
  // implicitly is less surprising than leaving a stale photo in place.
  const setBackground = React.useCallback((backgroundId: string) => {
    updateMe((p) => ({ ...p, backgroundId, backgroundImageUrl: undefined }))
  }, [updateMe])

  // url can be a BACKGROUND_IMAGES sample or a data URL from the user's own
  // upload (see readFileAsAttachment-style FileReader use in Settings.tsx);
  // passing undefined clears back to the solid color.
  const setBackgroundImage = React.useCallback((url: string | undefined) => {
    updateMe((p) => ({ ...p, backgroundImageUrl: url }))
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

  // Privacy toggle — enforced in ProfilePreviewPopover (the only place a
  // "Message" action shows up for someone else's profile).
  const setAllowDMs = React.useCallback((allow: boolean) => {
    updateMe((p) => ({ ...p, allowDMs: allow }))
  }, [updateMe])

  const setBirthdate = React.useCallback((birthdate: string) => {
    updateMe((p) => ({ ...p, birthdate }))
  }, [updateMe])

  const setGuardianConsent = React.useCallback((guardianEmail: string) => {
    const trimmed = guardianEmail.trim()
    if (!trimmed) return
    updateMe((p) => ({ ...p, guardianConsentEmail: trimmed }))
  }, [updateMe])

  // Endorsing is the one write any Builder can make on someone else's
  // profile — a substantive reason is required by the caller-side dialog
  // (min length, see MIN_ENDORSEMENT_REASON_LENGTH), enforced again here as
  // a last line of defense so a bare "very good" can never actually save,
  // dialog validation or not. evidenceUrl is optional — trimmed to empty
  // string filtered out, never stored as just whitespace.
  const addEndorsement = React.useCallback(
    (
      targetProfileId: string,
      targetType: 'skill' | 'project',
      targetName: string,
      reason: string,
      fromName: string,
      evidenceUrl?: string
    ) => {
      const trimmedReason = reason.trim()
      if (trimmedReason.length < MIN_ENDORSEMENT_REASON_LENGTH) return
      const trimmedEvidence = evidenceUrl?.trim()
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetProfileId
            ? {
                ...p,
                endorsements: [
                  {
                    id: `end-${Date.now()}`,
                    fromName,
                    targetType,
                    targetName,
                    reason: trimmedReason,
                    evidenceUrl: trimmedEvidence || undefined,
                  },
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
      setBackgroundImage,
      setName,
      setBio,
      setAvatar,
      setDiscipline,
      setOpenToWork,
      setInterests,
      setAllowDMs,
      setBirthdate,
      setGuardianConsent,
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
      setBackgroundImage,
      setName,
      setBio,
      setAvatar,
      setDiscipline,
      setOpenToWork,
      setInterests,
      setAllowDMs,
      setBirthdate,
      setGuardianConsent,
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
