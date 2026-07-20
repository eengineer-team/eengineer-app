import * as React from 'react'
import {
  ME_ID,
  MIN_ENDORSEMENT_REASON_LENGTH,
  type BuilderProfile,
  type ProjectEntry,
  type ExperienceEntry,
} from '@/lib/profile-data'
import type { Discipline } from '@/lib/community-data'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/profiles'

// Live Supabase-backed profile store shared across the list/detail routes.
// Only the ME_ID profile is ever editable by the current session; every
// mutation below enforces that instead of trusting the caller. RLS enforces
// the same rule server-side — this is UX, not the security boundary.

interface ProfilesContextValue {
  profiles: BuilderProfile[]
  // True until the first fetch settles. Consumers MUST check this before
  // treating a missing profile as "not found" — profiles load asynchronously
  // now, so on the very first render every id looks absent, and screens that
  // redirect on absence would bounce the user away mid-load.
  loading: boolean
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
  const [profiles, setProfiles] = React.useState<BuilderProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setProfiles(await api.fetchProfiles())
    } catch (err) {
      console.error('Failed to load profiles', err)
    } finally {
      // finally, not the try body: a failed fetch must also end the loading
      // state, otherwise an error leaves every screen stuck on a spinner.
      setLoading(false)
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

  const getProfile = React.useCallback((id: string) => profiles.find((p) => p.id === id), [profiles])

  // Applies an optimistic patch to the ME_ID profile, then fires the real
  // write. On failure, re-fetches to reconcile local state with the server
  // (RLS-denied writes never crash the UI — see block 17's recipe).
  const updateMe = React.useCallback(
    (fn: (p: BuilderProfile) => BuilderProfile, write: (uid: string) => Promise<void>) => {
      setProfiles((prev) => prev.map((p) => (p.id === ME_ID ? fn(p) : p)))
      const uid = uidRef.current
      if (!uid) return
      write(uid).catch((err) => {
        console.error('Profile update failed', err)
        void refresh()
      })
    },
    [refresh]
  )

  const rateSkill = React.useCallback(
    (skillName: string, proficiency: number) => {
      updateMe(
        (p) => ({ ...p, skills: p.skills.map((s) => (s.name === skillName ? { ...s, proficiency } : s)) }),
        (uid) => api.rateSkill(uid, skillName, proficiency)
      )
    },
    [updateMe]
  )

  const addSkill = React.useCallback(
    (skillName: string) => {
      const trimmed = skillName.trim()
      if (!trimmed) return
      const me = profiles.find((p) => p.id === ME_ID)
      if (me?.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return
      updateMe(
        (p) => ({ ...p, skills: [...p.skills, { name: trimmed, proficiency: 3 }] }),
        (uid) => api.addSkill(uid, trimmed)
      )
    },
    [updateMe, profiles]
  )

  const addProject = React.useCallback(
    (project: Omit<ProjectEntry, 'id'>) => {
      updateMe(
        (p) => ({ ...p, projects: [{ ...project, id: `p-me-${p.projects.length}` }, ...p.projects] }),
        (uid) => api.addProject(uid, project)
      )
    },
    [updateMe]
  )

  // Picking a solid color clears any photo background — the two are
  // mutually exclusive in the header banner, so switching one off the other
  // implicitly is less surprising than leaving a stale photo in place.
  const setBackground = React.useCallback(
    (backgroundId: string) => {
      updateMe(
        (p) => ({ ...p, backgroundId, backgroundImageUrl: undefined }),
        (uid) => api.setBackground(uid, backgroundId)
      )
    },
    [updateMe]
  )

  // url can be a BACKGROUND_IMAGES sample or a data URL from the user's own
  // upload (see readFileAsAttachment-style FileReader use in Settings.tsx);
  // passing undefined clears back to the solid color. Data URLs are uploaded
  // to the `avatars` bucket server-side; the local state briefly shows the
  // data URL until refresh() swaps in the stored public URL.
  const setBackgroundImage = React.useCallback(
    (url: string | undefined) => {
      updateMe(
        (p) => ({ ...p, backgroundImageUrl: url }),
        (uid) => api.setBackgroundImage(uid, url).then(() => void refresh())
      )
    },
    [updateMe, refresh]
  )

  // Renames the ME profile — this is the source Avatar/Profiles/Community
  // read from. Settings.tsx also calls auth-context's updateName alongside
  // this so the header greeting ("Hello, X") never drifts out of sync with
  // the profile card's displayed name.
  const setName = React.useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      updateMe(
        (p) => ({ ...p, name: trimmed }),
        (uid) => api.updateMyProfile(uid, { display_name: trimmed })
      )
    },
    [updateMe]
  )

  const setBio = React.useCallback(
    (bio: string) => {
      updateMe(
        (p) => ({ ...p, bio }),
        (uid) => api.updateMyProfile(uid, { bio })
      )
    },
    [updateMe]
  )

  const addExperience = React.useCallback(
    (entry: Omit<ExperienceEntry, 'id'>) => {
      updateMe(
        (p) => ({ ...p, experience: [{ ...entry, id: `x-me-${p.experience.length}` }, ...p.experience] }),
        (uid) => api.addExperience(uid, entry)
      )
    },
    [updateMe]
  )

  const setAvatar = React.useCallback(
    (avatarUrl: string) => {
      updateMe(
        (p) => ({ ...p, avatarUrl }),
        (uid) => api.setAvatar(uid, avatarUrl).then(() => void refresh())
      )
    },
    [updateMe, refresh]
  )

  const setDiscipline = React.useCallback(
    (discipline: Discipline) => {
      updateMe(
        (p) => ({ ...p, discipline }),
        (uid) => api.updateMyProfile(uid, { discipline })
      )
    },
    [updateMe]
  )

  const setOpenToWork = React.useCallback(
    (openToWork: boolean) => {
      updateMe(
        (p) => ({ ...p, openToWork }),
        (uid) => api.updateMyProfile(uid, { open_to_work: openToWork })
      )
    },
    [updateMe]
  )

  const setInterests = React.useCallback(
    (interests: string[]) => {
      updateMe(
        (p) => ({ ...p, interests }),
        (uid) => api.updateMyProfile(uid, { interests })
      )
    },
    [updateMe]
  )

  // Privacy toggle — enforced in ProfilePreviewPopover (the only place a
  // "Message" action shows up for someone else's profile).
  const setAllowDMs = React.useCallback(
    (allow: boolean) => {
      updateMe(
        (p) => ({ ...p, allowDMs: allow }),
        (uid) => api.updateMyProfile(uid, { allow_dms: allow })
      )
    },
    [updateMe]
  )

  const setBirthdate = React.useCallback(
    (birthdate: string) => {
      updateMe(
        (p) => ({ ...p, birthdate }),
        (uid) => api.setBirthdate(uid, birthdate)
      )
    },
    [updateMe]
  )

  const setGuardianConsent = React.useCallback(
    (guardianEmail: string) => {
      const trimmed = guardianEmail.trim()
      if (!trimmed) return
      updateMe(
        (p) => ({ ...p, guardianConsentEmail: trimmed }),
        (uid) => api.setGuardianConsent(uid, trimmed)
      )
    },
    [updateMe]
  )

  // Endorsing is the one write any Builder can make on someone else's
  // profile — a substantive reason is required by the caller-side dialog
  // (min length, see MIN_ENDORSEMENT_REASON_LENGTH), enforced again here as
  // a last line of defense so a bare "very good" can never actually save,
  // dialog validation or not (and again server-side by api.addEndorsement).
  // evidenceUrl is optional — trimmed to empty string filtered out, never
  // stored as just whitespace. fromName comes from the live joined data on
  // refresh, not the caller's copy, so it can never go stale.
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
      const uid = uidRef.current
      if (!uid) return
      const trimmedEvidence = evidenceUrl?.trim()
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetProfileId
            ? {
                ...p,
                endorsements: [
                  {
                    id: `end-${p.endorsements.length}`,
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
      api
        .addEndorsement(uid, targetProfileId, targetType, targetName, trimmedReason, trimmedEvidence)
        .then(() => void refresh())
        .catch((err) => {
          console.error('Endorsement failed', err)
          void refresh()
        })
    },
    [refresh]
  )

  // Connect request toggle — mirrors My Network's request/withdraw pattern,
  // but scoped to a single profile (no accept/decline here: the target isn't
  // "yours" to manage, only your own outgoing request is).
  const toggleConnect = React.useCallback(
    (targetProfileId: string) => {
      const target = profiles.find((p) => p.id === targetProfileId)
      if (!target || target.connectStatus === 'connected') return
      const uid = uidRef.current
      if (!uid) return
      const currentStatus = target.connectStatus
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== targetProfileId) return p
          if (p.connectStatus === 'connected') return p
          return { ...p, connectStatus: p.connectStatus === 'requested' ? 'none' : 'requested' }
        })
      )
      api.toggleConnect(uid, targetProfileId, currentStatus).catch((err) => {
        console.error('Connect toggle failed', err)
        void refresh()
      })
    },
    [profiles, refresh]
  )

  const value = React.useMemo(
    () => ({
      profiles,
      loading,
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
      loading,
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
