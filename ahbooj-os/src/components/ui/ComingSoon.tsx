import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'

interface ComingSoonProps {
  module: string
  description?: string
}

export function ComingSoon({ module, description }: ComingSoonProps) {
  return (
    <PageWrapper>
      <Card>
        <div className="text-center py-16">
          <p className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
            AhbooJ OS
          </p>
          <h2 className="font-display text-3xl font-semibold text-espresso mb-3">
            {module}
          </h2>
          <p className="text-muted max-w-sm mx-auto">
            {description ?? 'This module is coming soon. Phase implementation in progress.'}
          </p>
        </div>
      </Card>
    </PageWrapper>
  )
}
