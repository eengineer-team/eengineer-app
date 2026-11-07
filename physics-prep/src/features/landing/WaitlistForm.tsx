import { useId, useState, type FormEvent } from 'react'
import { CircleAlert, CircleCheck, Clock, LoaderCircle } from 'lucide-react'
import { Button, cx } from '@/components/ui'
import { joinWaitlist } from '@/lib/api/waitlist'

type Status = 'idle' | 'sending' | 'success' | 'invalid' | 'offline' | 'error'

const MESSAGES: Record<Exclude<Status, 'idle' | 'sending' | 'success'>, string> = {
  invalid: 'That email address doesn’t look right. Check it and try again.',
  offline: 'Early access sign-ups open soon. We aren’t collecting emails just yet, so please check back in a few days.',
  error: 'Something went wrong on our side and your email wasn’t saved. Please try again in a minute.',
}

interface WaitlistFormProps {
  /** Stored with the email so we can tell which page the interest came from. */
  source: string
  submitLabel?: string
  successTitle?: string
  successBody: string
  className?: string
  autoFocus?: boolean
}

export function WaitlistForm({
  source,
  submitLabel = 'Get early access',
  successTitle = 'You’re on the list.',
  successBody,
  className,
  autoFocus,
}: WaitlistFormProps) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await joinWaitlist(email, source)
      setStatus(res.ok ? 'success' : res.reason)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className={cx('flex items-start gap-3 rounded-lg border border-good/40 bg-good/10 p-4', className)}>
        <CircleCheck size={20} className="mt-0.5 shrink-0 text-good" aria-hidden />
        <div>
          <p className="font-semibold text-text">{successTitle}</p>
          <p className="mt-1 text-sm text-muted">{successBody}</p>
        </div>
      </div>
    )
  }

  const message = status === 'invalid' || status === 'offline' || status === 'error' ? MESSAGES[status] : null
  const inputId = `${id}-email`
  const msgId = `${id}-msg`

  return (
    <form onSubmit={onSubmit} noValidate className={className} aria-busy={status === 'sending'}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus={autoFocus}
          required
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'invalid' || status === 'error') setStatus('idle')
          }}
          aria-invalid={status === 'invalid' || undefined}
          aria-describedby={message ? msgId : undefined}
          className={cx(
            'min-w-0 flex-1 rounded-lg border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/70',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            status === 'invalid' ? 'border-bad' : 'border-border',
          )}
        />
        <Button type="submit" disabled={status === 'sending'} className="py-2.5 sm:shrink-0">
          {status === 'sending' ? (
            <>
              <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />
              Sending…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
      <div aria-live="polite" className="min-h-[1.25rem]">
        {message && (
          <p
            id={msgId}
            className={cx('mt-2 flex items-start gap-2 text-sm', status === 'offline' ? 'text-muted' : 'text-bad')}
          >
            {status === 'offline' ? (
              <Clock size={16} className="mt-0.5 shrink-0" aria-hidden />
            ) : (
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
            )}
            {message}
          </p>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">We’ll only email you about eengineer Physics. No spam, and you can opt out any time.</p>
    </form>
  )
}
