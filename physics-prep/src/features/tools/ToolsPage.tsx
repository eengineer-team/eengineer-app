import { Link } from 'react-router-dom'
import { Activity, Move } from 'lucide-react'
import { Card, Container, PageHeader } from '@/components/ui'

const TOOLS = [
  {
    to: '/tools/free-body',
    icon: Move,
    title: 'Free-body diagram builder',
    body: 'Draw the forces on an object and get instant feedback on whether your diagram is right.',
  },
  {
    to: '/tools/motion',
    icon: Activity,
    title: 'Motion simulator',
    body: 'Projectiles, inclines, pulleys and springs. Change the inputs and watch x, v and a graphs update live.',
  },
]

export function ToolsPage() {
  return (
    <Container>
      <PageHeader eyebrow="Free forever" title="Interactive tools">
        Build it, move it, see the physics.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ to, icon: Icon, title, body }) => (
          <Link key={to} to={to}>
            <Card className="h-full transition-colors hover:border-accent">
              <Icon className="mb-3 text-accent" />
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
