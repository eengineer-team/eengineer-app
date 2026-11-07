import { ButtonLink, Container, PageHeader } from '@/components/ui'

export function NotFound() {
  return (
    <Container>
      <PageHeader title="Page not found">That page does not exist.</PageHeader>
      <ButtonLink to="/">Back home</ButtonLink>
    </Container>
  )
}
