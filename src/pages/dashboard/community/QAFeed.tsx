import * as React from 'react'
import { Plus } from 'lucide-react'
import { SEED_QUESTIONS, type Discipline, type Question } from '@/lib/community-data'
import { QuestionCard } from '@/components/community/QuestionCard'
import { NewQuestionDialog } from '@/components/community/NewQuestionDialog'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

let nextId = SEED_QUESTIONS.length + 1

export function QAFeed({ readOnly = false }: { readOnly?: boolean }) {
  const [questions, setQuestions] = React.useState<Question[]>(SEED_QUESTIONS)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  function handleVote(id: string, vote: 'approve' | 'disapprove') {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const wasVote = q.myVote
        let approvals = q.approvals
        let disapprovals = q.disapprovals

        if (wasVote === 'approve') approvals--
        if (wasVote === 'disapprove') disapprovals--

        const nextVote = wasVote === vote ? null : vote
        if (nextVote === 'approve') approvals++
        if (nextVote === 'disapprove') disapprovals++

        return { ...q, approvals, disapprovals, myVote: nextVote }
      })
    )
  }

  function handleReport(id: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, reported: true } : q)))
  }

  function handleComment(id: string, text: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, comments: [...q.comments, { id: `c-${Date.now()}`, author: 'You', text }] }
          : q
      )
    )
  }

  function handleNewQuestion(category: Discipline, text: string) {
    const question: Question = {
      id: `q-${nextId++}`,
      category,
      text,
      author: 'You',
      approvals: 0,
      disapprovals: 0,
      myVote: null,
      reported: false,
      comments: [],
    }
    setQuestions((prev) => [question, ...prev])
    setDialogOpen(false)
  }

  return (
    <div>
      <div className="relative flex items-center justify-between mb-6">
        <LabelCaps>Single feed · no subcategories</LabelCaps>
        {!readOnly && (
          <Button variant="accent" size="sm" onClick={() => setDialogOpen((v) => !v)}>
            <Plus size={14} strokeWidth={2} />
            Ask a question
          </Button>
        )}

        {!readOnly && dialogOpen && (
          <NewQuestionDialog
            existingQuestions={questions}
            onSubmit={handleNewQuestion}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            readOnly={readOnly}
            onVote={handleVote}
            onReport={handleReport}
            onComment={handleComment}
          />
        ))}
      </div>
    </div>
  )
}
