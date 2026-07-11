// Shared attachment shape for anything that lets a Builder attach a photo,
// video, or file — Messages (Step 12), Networking intros, and the Community
// discussion feed all use this same type so the picker/preview/render logic
// doesn't have to be reinvented per surface. `link` stays message-only (a
// pasted URL auto-detected as a link, not a real upload) but lives here too
// so one Attachment type covers every surface.
export interface Attachment {
  kind: 'image' | 'video' | 'file' | 'link'
  /** Data URL for image/video/file uploads, or the raw URL for a shared link. */
  url: string
  name?: string
}

// Reads a File into an in-memory data-URL Attachment — no backend, no real
// upload, same "local-only, no verifiable lies" honesty as the rest of the
// app's mock features. Kind is inferred from MIME type; anything that isn't
// image/video falls back to a generic 'file' attachment (icon + filename).
export function readFileAsAttachment(file: File): Promise<Attachment> {
  const kind: Attachment['kind'] = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : 'file'
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ kind, url: reader.result as string, name: file.name })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
